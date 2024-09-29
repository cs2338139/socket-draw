import { createContext, useContext, useState } from "react";
import { Image, Path } from "@classes";

const DataContext = createContext({ images: [], paths: [] } as { images: Image[], paths: Path[] });

export const useData = () => {
    return useContext(DataContext)
}

export function DataContextProvider({ children }: { children: React.ReactNode }) {
    const images: Image[] = []
    const paths: Path[] = []

    return (
        <DataContext.Provider value={{ images, paths }} >
            {children}
        </DataContext.Provider >
    )
}
