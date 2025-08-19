
"use client";

import { Map, Marker } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

interface ClientMapProps {
    position: { lat: number; lng: number };
    mapRef: React.MutableRefObject<google.maps.Map | null>;
}

export function ClientMap({ position, mapRef }: ClientMapProps) {
  const internalMapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (internalMapRef.current) {
        mapRef.current = internalMapRef.current;
    }
  }, [mapRef]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <Map
        ref={internalMapRef}
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling={"cooperative"}
        disableDefaultUI={true}
        mapId="a3b0213a3b692823"
        key={position.lat + '-' + position.lng}
      >
        <Marker position={position} />
      </Map>
    </div>
  );
}
