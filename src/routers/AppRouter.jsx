import { useEffect, useRef } from 'react';
import shell from '../pages/Layout.html?raw';
import { mountApplication } from '../controllers/movieController.js';

export default function AppRouter() {
  const root = useRef(null);
  useEffect(() => mountApplication(root.current), []);
  return (
    <div
      ref={root}
      dangerouslySetInnerHTML={{ __html: shell }}
    />
  );
}
