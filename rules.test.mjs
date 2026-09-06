import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, updateDoc, getDoc, addDoc, collection, getDocs, deleteField } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'tawla-e6f71',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
});

const A = env.authenticatedContext('uidA').firestore();
const B = env.authenticatedContext('uidB').firestore();
const C = env.authenticatedContext('uidC').firestore();

const P = (id, host=false) => ({ id, name: id, username: '@'+id, avatarUrl: '', isHost: host, isReady: false });
let pass = 0, fail = 0;
const check = async (label, p) => { try { await p; console.log('PASS', label); pass++; } catch (e) { console.log('FAIL', label, e.message.slice(0,120)); fail++; } };

const roomBase = (code) => ({
  id: code, code, title: 't', gameId: 'mecanque', gameTitle: 'g', mode: 'friends', playType: 'virtual',
  hostId: 'uidA', hostName: 'A', hostAvatar: '', currentPlayers: 1, maxPlayers: 4, isPrivate: false,
  status: 'waiting', players: [P('uidA', true)], playerIds: ['uidA'], mecanqueSettings: null,
});

await check('create room as host', assertSucceeds(setDoc(doc(A,'antifada_rooms/R1'), roomBase('R1'))));
await check('create room impersonating other host rejected', assertFails(setDoc(doc(B,'antifada_rooms/R2'), {...roomBase('R2'), hostId:'uidA'})));
await check('non-member cannot chat', assertFails(addDoc(collection(B,'antifada_rooms/R1/messages'), {senderId:'uidB',senderName:'B',senderAvatar:'',text:'hi',createdAt:new Date()})));
await check('host can chat', assertSucceeds(addDoc(collection(A,'antifada_rooms/R1/messages'), {senderId:'uidA',senderName:'A',senderAvatar:'',text:'hi',createdAt:new Date()})));
await check('non-member cannot read chat', assertFails(getDocs(collection(B,'antifada_rooms/R1/messages'))));
await check('B joins', assertSucceeds(updateDoc(doc(B,'antifada_rooms/R1'), {players:[P('uidA',true),P('uidB')], playerIds:['uidA','uidB'], currentPlayers:2})));
await check('B reads chat after join', assertSucceeds(getDocs(collection(B,'antifada_rooms/R1/messages'))));
await check('B sends chat after join', assertSucceeds(addDoc(collection(B,'antifada_rooms/R1/messages'), {senderId:'uidB',senderName:'B',senderAvatar:'',text:'hello',createdAt:new Date()})));
await check('B cannot spoof senderId', assertFails(addDoc(collection(B,'antifada_rooms/R1/messages'), {senderId:'uidA',senderName:'A',senderAvatar:'',text:'x',createdAt:new Date()})));
await check('B toggles own ready', assertSucceeds(updateDoc(doc(B,'antifada_rooms/R1'), {players:[P('uidA',true),{...P('uidB'), isReady:true}], playerIds:['uidA','uidB']})));
await check('C cannot inject B removal', assertFails(updateDoc(doc(C,'antifada_rooms/R1'), {players:[P('uidA',true)], playerIds:['uidA'], currentPlayers:1})));
await check('non-host cannot start game', assertFails(updateDoc(doc(B,'antifada_rooms/R1'), {status:'in_progress'})));
await check('host starts game', assertSucceeds(updateDoc(doc(A,'antifada_rooms/R1'), {status:'in_progress'})));
await check('cannot join started room', assertFails(updateDoc(doc(C,'antifada_rooms/R1'), {players:[P('uidA',true),P('uidB'),P('uidC')], playerIds:['uidA','uidB','uidC'], currentPlayers:3})));
await check('B leaves (self removal)', assertSucceeds(updateDoc(doc(B,'antifada_rooms/R1'), {players:[P('uidA',true)], playerIds:['uidA'], currentPlayers:1})));
await check('nobody can delete room', assertFails((async()=>{const {deleteDoc}=await import('firebase/firestore');return deleteDoc(doc(A,'antifada_rooms/R1'));})()));

// full room capacity
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db,'antifada_rooms/R3'), {...roomBase('R3'), maxPlayers:2, players:[P('uidA',true),P('uidB')], playerIds:['uidA','uidB'], currentPlayers:2});
  // legacy room, no playerIds
  const legacy = {...roomBase('R4')}; delete legacy.playerIds;
  legacy.players = [P('uidA',true), P('uidB')]; legacy.currentPlayers = 2;
  await setDoc(doc(db,'antifada_rooms/R4'), legacy);
});
await check('cannot exceed maxPlayers', assertFails(updateDoc(doc(C,'antifada_rooms/R3'), {players:[P('uidA',true),P('uidB'),P('uidC')], playerIds:['uidA','uidB','uidC'], currentPlayers:3})));
await check('legacy room: chat denied before backfill', assertFails(getDocs(collection(B,'antifada_rooms/R4/messages'))));
await check('legacy backfill by member allowed', assertSucceeds(updateDoc(doc(B,'antifada_rooms/R4'), {playerIds:['uidA','uidB']})));
await check('legacy chat works after backfill', assertSucceeds(addDoc(collection(B,'antifada_rooms/R4/messages'), {senderId:'uidB',senderName:'B',senderAvatar:'',text:'hi',createdAt:new Date()})));
await check('outsider cannot backfill themselves in', assertFails(updateDoc(doc(C,'antifada_rooms/R3'), {playerIds:['uidA','uidB','uidC']})));
await check('public can read room doc', assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'antifada_rooms/R1'))));
await check('users: self create', assertSucceeds(setDoc(doc(A,'users/uidA'), {username:'A', role:'player'})));
await check('users: cannot self-promote to admin', assertFails(updateDoc(doc(A,'users/uidA'), {role:'admin'})));
await check('cards read-only', assertFails(setDoc(doc(A,'cards/x'), {t:'x'})));
await check('legacy rooms collection locked', assertFails(getDoc(doc(A,'rooms/anything'))));

// reports (player abuse reports)
await check('report: reporter can create', assertSucceeds(addDoc(collection(A,'reports'), {reporterId:'uidA', reportedUserId:'uidB', reportedUsername:'B', roomCode:null, messageId:null, messageText:'', reason:'harassment', status:'open', createdAt:new Date()})));
await check('report: cannot spoof reporterId', assertFails(addDoc(collection(A,'reports'), {reporterId:'uidB', reportedUserId:'uidC', reportedUsername:'C', roomCode:null, messageId:null, messageText:'', reason:'x', status:'open', createdAt:new Date()})));
await check('report: non-admin cannot read reports', assertFails(getDocs(collection(A,'reports'))));

// supportMessages (Help Center: problem reports / contact support)
await check('support: sender can file a problem report', assertSucceeds(addDoc(collection(A,'supportMessages'), {senderId:'uidA', type:'problem', category:'bug', message:'The app crashed', status:'open', createdAt:new Date()})));
await check('support: sender can file a contact message', assertSucceeds(addDoc(collection(A,'supportMessages'), {senderId:'uidA', type:'contact', category:null, message:'How do I delete my account?', status:'open', createdAt:new Date()})));
await check('support: cannot spoof senderId', assertFails(addDoc(collection(A,'supportMessages'), {senderId:'uidB', type:'contact', category:null, message:'x', status:'open', createdAt:new Date()})));
await check('support: empty message rejected', assertFails(addDoc(collection(A,'supportMessages'), {senderId:'uidA', type:'contact', category:null, message:'', status:'open', createdAt:new Date()})));
await check('support: invalid type rejected', assertFails(addDoc(collection(A,'supportMessages'), {senderId:'uidA', type:'other', category:null, message:'x', status:'open', createdAt:new Date()})));
await check('support: non-admin cannot read messages', assertFails(getDocs(collection(A,'supportMessages'))));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
