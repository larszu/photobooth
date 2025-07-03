import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import server from '../server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, '../../photos');

describe('Photobooth API', () => {
  it('should return gallery mode by default', async () => {
    const res = await request(server).get('/api/mode');
    expect(res.body.mode).toBe('gallery');
  });
  // Weitere Tests für Fotoaufnahme, Fotoabruf, QR-Code etc.
});
