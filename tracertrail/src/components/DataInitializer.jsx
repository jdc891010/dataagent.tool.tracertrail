import { useEffect, useRef } from 'react';
import { dataAgent } from '@/api/dataAgentClient';
import { populateSampleData } from '@/utils/sampleDataGenerator';

export function DataInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    const initData = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const projects = await dataAgent.entities.Project.list();
        if (projects.length === 0) {
          console.log("No projects found. Seeding sample data...");
          await populateSampleData();
          console.log("Sample data seeded successfully.");
          // Refresh the page or invalidate queries if needed, 
          // but react-query should handle it if components fetch on mount.
          window.location.reload(); 
        }
      } catch (error) {
        console.error("Failed to check or seed data:", error);
      }
    };

    initData();
  }, []);

  return null;
}
