import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SchoolState {
  /** The school every other module's data/actions are scoped to. */
  selectedSchoolId: string | null;
  setSelectedSchoolId: (id: string) => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      selectedSchoolId: null,
      setSelectedSchoolId: (id) => set({ selectedSchoolId: id }),
    }),
    { name: "patino-selected-school" },
  ),
);
