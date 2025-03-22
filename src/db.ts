import Dexie, { Table } from 'dexie';
import { Student, ParticipationRecord, Section } from './types';

export class ParticipationDB extends Dexie {
  students!: Table<Student>;
  participationRecords!: Table<ParticipationRecord>;
  sections!: Table<Section>;

  constructor() {
    super('ParticipationDB');
    this.version(7).stores({
      students: 'id, firstName, lastName, participationCount, lastParticipation, rank, totalScore, sectionId, protected',
      participationRecords: 'id, studentId, timestamp, duration, quality, keywords, confidence',
      sections: 'id, name, createdAt'
    });
  }
}

export const db = new ParticipationDB();