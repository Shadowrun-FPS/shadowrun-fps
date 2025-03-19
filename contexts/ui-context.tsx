import React, { createContext, useState, ReactNode } from "react";

// If you have a UI context, make sure the dialog state is properly managed
export const UIContext = createContext({
  isCreateTournamentDialogOpen: false,
  setCreateTournamentDialogOpen: (isOpen: boolean) => {},
  // other UI state...
});

export function UIProvider({ children }: { children: ReactNode }) {
  const [isCreateTournamentDialogOpen, setCreateTournamentDialogOpen] =
    useState(false);

  return (
    <UIContext.Provider
      value={{
        isCreateTournamentDialogOpen,
        setCreateTournamentDialogOpen,
        // other UI state...
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
