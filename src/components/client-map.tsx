"use client";

import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { Button } from "./ui/button";
import { LocateFixed } from "lucide-react";

interface ClientMapProps {
    position: { lat: number; lng: number };
}

export const ClientMap = ({ position }: ClientMapProps) => {
    const map = useMap();

    const handleRecenter = () => {
        if (map) {
            map.panTo(position);
            map.setZoom(15);
        }
    };
    
    return (
        <div className="h-full w-full rounded-lg overflow-hidden relative">
            <Map
                defaultCenter={position}
                defaultZoom={15}
                gestureHandling={"cooperative"}
                disableDefaultUI={true}
                mapId="a3b0213a3b692823"
            >
                <Marker position={position} />
            </Map>
             <Button
                size="icon"
                onClick={handleRecenter}
                className="absolute bottom-4 right-4 z-10 rounded-full"
                variant="secondary"
                aria-label="Centrar mapa"
            >
                <LocateFixed className="h-5 w-5" />
            </Button>
        </div>
    );
};
