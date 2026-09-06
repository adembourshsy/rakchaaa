import { db } from './config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { CarData } from '../types';
import { CAR_DATABASE } from '../data/carData';

export async function fetchMecanqueCarsFromFirestore(): Promise<CarData[]> {
  let localCustomCars: CarData[] = [];
  try {
    const localCustomJson = localStorage.getItem('af_custom_mecanque_cars');
    if (localCustomJson) {
      localCustomCars = JSON.parse(localCustomJson);
    }
  } catch (err) {
    console.warn('[mecanqueCardsService] Failed to parse local custom cars:', err);
  }

  try {
    const q = query(collection(db, 'mecanque_cars'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const cars: CarData[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      cars.push({
        id: docSnap.id,
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        fullName: data.fullName || `${data.manufacturer} ${data.model}`,
        country: data.country || '🌍',
        flag: data.flag || '🏁',
        engine: data.engine || '',
        cylinders: data.cylinders || '',
        fuelType: data.fuelType || '',
        year: data.year || '',
        bodyType: data.bodyType || '',
        performance: data.performance || '',
        difficulty: data.difficulty || 'beginner',
        soundProfile: data.soundProfile || 'v6_turbo',
        customAudioUrl: data.customAudioUrl || undefined,
        customImageUrl: data.customImageUrl || undefined,
        acceptedAnswers: Array.isArray(data.acceptedAnswers) ? data.acceptedAnswers : [data.fullName],
        clues: Array.isArray(data.clues) ? data.clues : [],
      });
    });

    // Merge Firestore cars, local custom cars, and CAR_DATABASE
    const customIds = new Set(cars.map((c) => c.id));
    localCustomCars.forEach((lc) => {
      if (!customIds.has(lc.id)) {
        cars.unshift(lc);
        customIds.add(lc.id);
      }
    });

    const merged = [...cars];
    CAR_DATABASE.forEach((c) => {
      if (!customIds.has(c.id)) {
        merged.push(c);
      }
    });

    return merged;
  } catch (err) {
    console.warn('[mecanqueCardsService] Failed to fetch cars from Firestore, fallback to local database:', err);
    const customIds = new Set(localCustomCars.map((c) => c.id));
    const merged = [...localCustomCars];
    CAR_DATABASE.forEach((c) => {
      if (!customIds.has(c.id)) {
        merged.push(c);
      }
    });
    return merged;
  }
}

function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean as Partial<T>;
}

export async function addMecanqueCar(carData: Omit<CarData, 'id'>): Promise<CarData> {
  const docRef = doc(collection(db, 'mecanque_cars'));
  const carId = docRef.id;

  const newCar: CarData = {
    ...carData,
    id: carId,
  };

  // Always save locally to ensure instant feedback and offline persistence
  try {
    const savedLocal: CarData[] = JSON.parse(localStorage.getItem('af_custom_mecanque_cars') || '[]');
    savedLocal.unshift(newCar);
    localStorage.setItem('af_custom_mecanque_cars', JSON.stringify(savedLocal));
  } catch (e) {
    console.warn('[mecanqueCardsService] Could not save car to localStorage:', e);
  }

  // Save to Firestore without undefined properties
  const cleanData = removeUndefinedFields({
    ...newCar,
    createdAt: serverTimestamp(),
  });

  try {
    await setDoc(docRef, cleanData);
  } catch (err) {
    console.warn('[mecanqueCardsService] Could not sync car to Firestore, saved locally:', err);
  }

  return newCar;
}

export async function updateMecanqueCar(carId: string, carData: Partial<CarData>): Promise<void> {
  // Update local storage if present
  try {
    const savedLocal: CarData[] = JSON.parse(localStorage.getItem('af_custom_mecanque_cars') || '[]');
    const index = savedLocal.findIndex((c) => c.id === carId);
    if (index !== -1) {
      savedLocal[index] = { ...savedLocal[index], ...carData };
      localStorage.setItem('af_custom_mecanque_cars', JSON.stringify(savedLocal));
    }
  } catch (e) {
    console.warn('[mecanqueCardsService] Could not update car in localStorage:', e);
  }

  const cleanData = removeUndefinedFields({
    ...carData,
    updatedAt: serverTimestamp(),
  });

  try {
    const docRef = doc(db, 'mecanque_cars', carId);
    await updateDoc(docRef, cleanData);
  } catch (err) {
    console.warn('[mecanqueCardsService] Could not update car in Firestore:', err);
  }
}

export async function deleteMecanqueCar(carId: string): Promise<void> {
  // Delete from local storage if present
  try {
    const savedLocal: CarData[] = JSON.parse(localStorage.getItem('af_custom_mecanque_cars') || '[]');
    const filtered = savedLocal.filter((c) => c.id !== carId);
    localStorage.setItem('af_custom_mecanque_cars', JSON.stringify(filtered));
  } catch (e) {
    console.warn('[mecanqueCardsService] Could not delete car from localStorage:', e);
  }

  try {
    const docRef = doc(db, 'mecanque_cars', carId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[mecanqueCardsService] Could not delete car from Firestore:', err);
  }
}
