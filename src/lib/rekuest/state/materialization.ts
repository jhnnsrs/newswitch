import { applyPatch } from 'fast-json-patch';
import type { PatchSegment, SnapshotEnvelope } from '@/lib/rekuest/state/store';
import type { RevisedStatesSnapshotMap } from '@/lib/rekuest/transport/types';

export const DEFAULT_MAX_LOCAL_MATERIALIZATION_EVENTS = 250;
export const DEFAULT_FORWARD_EVENT_WINDOW = 50;

export type CheckoutConfig = {
  maxLocalMaterializationEvents: number;
  forwardEventWindow: number;
};

export type LocalMaterializationPlan = {
  baseSnapshot: SnapshotEnvelope;
  segments: PatchSegment[];
  eventCount: number;
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * The transport API accepts revision identifiers as `string | number`, but the
 * local history cache can only replay forward ranges when the identifier is a
 * numeric global revision.
 */
export function toNumericGlobalRevision(
  revision: string | number,
): number | null {
  const numericRevision = typeof revision === 'number' ? revision : Number(revision);
  return Number.isFinite(numericRevision) ? numericRevision : null;
}

export function toSnapshotMap(
  snapshot: SnapshotEnvelope,
): RevisedStatesSnapshotMap {
  return Object.fromEntries(
    snapshot.state_snapshots.map((stateSnapshot) => [
      stateSnapshot.name,
      {
        value: deepClone(stateSnapshot.value),
        revision: stateSnapshot.revision,
      },
    ]),
  );
}

function hasAllStateKeys(snapshot: SnapshotEnvelope, stateKeys: string[]) {
  const availableKeys = new Set(snapshot.state_snapshots.map((entry) => entry.name));
  return stateKeys.every((stateKey) => availableKeys.has(stateKey));
}

function countSegmentEvents(segments: PatchSegment[]) {
  return segments.reduce((count, segment) => count + segment.envelopes.length, 0);
}

/**
 * Cached patch segments are stored as forward-only contiguous ranges. This
 * function finds a replay plan from a cached snapshot to the requested target.
 */
export function buildLocalMaterializationPlan(
  snapshots: SnapshotEnvelope[],
  segments: PatchSegment[],
  stateKeys: string[],
  targetRevision: number,
  maxLocalMaterializationEvents: number,
): LocalMaterializationPlan | null {
  const candidateSnapshots = snapshots
    .filter((snapshot) => hasAllStateKeys(snapshot, stateKeys))
    .map((snapshot) => ({
      snapshot,
      numericRevision: toNumericGlobalRevision(snapshot.revision),
    }))
    .filter(
      (
        snapshot,
      ): snapshot is { snapshot: SnapshotEnvelope; numericRevision: number } =>
        snapshot.numericRevision !== null && snapshot.numericRevision <= targetRevision,
    )
    .sort((left, right) => right.numericRevision - left.numericRevision);

  const sortedSegments = [...segments].sort(
    (left, right) => left.from_global_rev - right.from_global_rev,
  );

  for (const candidate of candidateSnapshots) {
    let cursor = candidate.numericRevision;
    const collectedSegments: PatchSegment[] = [];

    while (cursor < targetRevision) {
      const nextSegment = sortedSegments.find(
        (segment) =>
          segment.from_global_rev === cursor && segment.to_global_rev <= targetRevision,
      );

      if (!nextSegment) {
        break;
      }

      collectedSegments.push(nextSegment);
      cursor = nextSegment.to_global_rev;
    }

    if (cursor !== targetRevision) {
      continue;
    }

    const eventCount = countSegmentEvents(collectedSegments);
    if (eventCount > maxLocalMaterializationEvents) {
      return null;
    }

    return {
      baseSnapshot: candidate.snapshot,
      segments: collectedSegments,
      eventCount,
    };
  }

  return null;
}

export function materializeSnapshotMap(
  baseSnapshots: RevisedStatesSnapshotMap,
  segments: PatchSegment[],
): RevisedStatesSnapshotMap {
  const materialized = deepClone(baseSnapshots);

  for (const segment of segments) {
    for (const envelope of segment.envelopes) {
      const currentState = materialized[envelope.state_name];

      if (!currentState) {
        throw new Error(
          `Cannot materialize unknown state ${envelope.state_name} from cached history.`,
        );
      }

      const patchedValue = applyPatch(
        deepClone(currentState.value),
        envelope.patches,
      ).newDocument;

      materialized[envelope.state_name] = {
        value: patchedValue,
        revision: envelope.rev,
      };
    }
  }

  return materialized;
}
