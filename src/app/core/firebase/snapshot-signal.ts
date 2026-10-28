import { DestroyRef, signal, Signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';

/**
 * Bridges a Firestore listener into a signal and stops listening when the caller is destroyed,
 * so screens only pay for reads while they are open.
 */
export function snapshotSignal<T>(
  listen: (next: (value: T) => void) => Unsubscribe,
  initial: T,
  destroyRef: DestroyRef,
): Signal<T> {
  const value = signal<T>(initial);
  const unsubscribe = listen((v) => value.set(v));
  destroyRef.onDestroy(unsubscribe);
  return value.asReadonly();
}
