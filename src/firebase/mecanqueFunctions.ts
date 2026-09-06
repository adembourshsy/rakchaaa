import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

export const startMecanqueGame = httpsCallable(functions, 'startMecanqueGame');
export const submitMecanqueGuess = httpsCallable(functions, 'submitMecanqueGuess');
export const advanceMecanqueRound = httpsCallable(functions, 'advanceMecanqueRound');
