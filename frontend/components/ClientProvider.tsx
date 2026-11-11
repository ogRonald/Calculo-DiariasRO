'use client';

import React, { ReactNode } from 'react';
import { DiariasProvider } from '../contexts/DiariasContext';

export default function ClientProvider({ children }: { children: ReactNode }) {
  return <DiariasProvider>{children}</DiariasProvider>;
}