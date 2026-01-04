import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataAgent } from '@/api/dataAgentClient';
import { populateSampleData } from '@/utils/sampleDataGenerator';

export function DataInitializer() {
  const initialized = useRef(false);
  const queryClient = useQueryClient();

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
          
          // Invalidate all queries to refresh UI without reloading page
          queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error("Failed to check or seed data:", error);
      }
    };

    initData();
  }, [queryClient]);

  return null;
}
