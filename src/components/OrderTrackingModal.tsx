"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Navigation,
  Package,
  MapPin,
  Clock,
  Bike,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import type { Order } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  userId: string;
}

interface LocationUpdate {
  type: "location_update" | "status_update";
  location?: { lat: number; lng: number };
  status?: string;
  timestamp: string;
}

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export function OrderTrackingModal({
  isOpen,
  onClose,
  order,
  userId,
}: OrderTrackingModalProps) {
  const [riderLocation, setRiderLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingAttempts, setGeocodingAttempts] = useState(0);
  const [mapInitialized, setMapInitialized] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routingControlRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track intentional close — avoids stale closure bug in onclose handler
  const isClosingRef = useRef(false);

  // Custom rider icon (red truck)
  const riderIcon = L.divIcon({
    html: `
      <div style="
        background: #E97474;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  // Custom destination icon (green marker)
  const destinationIcon = L.divIcon({
    html: `
      <div style="
        background: #00A082;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  // Parse initial rider location from order
  useEffect(() => {
    if (order.riderCurrentLocation) {
      try {
        let coords: number[] = [];

        if (typeof order.riderCurrentLocation === "string") {
          const str = order.riderCurrentLocation.replace(/[\[\]\s]/g, "");
          coords = str.split(",").map(Number);
        } else if (Array.isArray(order.riderCurrentLocation)) {
          coords = order.riderCurrentLocation;
        } else if (
          typeof order.riderCurrentLocation === "object" &&
          order.riderCurrentLocation !== null &&
          "lat" in order.riderCurrentLocation &&
          "lng" in order.riderCurrentLocation
        ) {
          setRiderLocation({
            lat: (order.riderCurrentLocation as any).lat,
            lng: (order.riderCurrentLocation as any).lng,
          });
          return;
        }

        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          setRiderLocation({ lat: coords[0], lng: coords[1] });
        }
      } catch (error) {
        console.error("Error parsing rider location:", error);
      }
    }
  }, [order.riderCurrentLocation]);

  // Geocoding function
  const geocodeAddress = useCallback(
    async (address: string): Promise<{ lat: number; lng: number } | null> => {
      if (!address) {
        setMapError("No destination address provided");
        return null;
      }

      setIsGeocoding(true);
      setMapError(null);
      setGeocodingAttempts((prev) => prev + 1);

      try {
        // Check if it's already coordinates
        const coordinateMatch = address.match(
          /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/,
        );
        if (coordinateMatch) {
          const lat = parseFloat(coordinateMatch[1]);
          const lng = parseFloat(coordinateMatch[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setIsGeocoding(false);
            return { lat, lng };
          }
        }

        // Try to extract coordinates from Google Maps links
        const googleMapsMatch = address.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (googleMapsMatch) {
          const lat = parseFloat(googleMapsMatch[1]);
          const lng = parseFloat(googleMapsMatch[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setIsGeocoding(false);
            return { lat, lng };
          }
        }

        // Use Nominatim for addresses
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "DeliveryApp/1.0",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Geocoding service error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const result = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          setIsGeocoding(false);
          return result;
        }

        // Fallback to Nigeria center
        setMapError("Using approximate location for Nigeria");
        setIsGeocoding(false);
        return { lat: 9.082, lng: 8.6753 };
      } catch (error) {
        console.error("Geocoding error:", error);
        setMapError("Using approximate location due to error");
        setIsGeocoding(false);
        return { lat: 9.082, lng: 8.6753 };
      }
    },
    [],
  );

  // Geocode destination address
  useEffect(() => {
    if (!isOpen || !order.customerLocationPrecise) {
      setDestinationLocation(null);
      return;
    }

    const initDestination = async () => {
      if (order.customerLat && order.customerLng) {
        setDestinationLocation({
          lat: order.customerLat,
          lng: order.customerLng,
        });
        return;
      }
      if (!order.customerLocationPrecise) return;

      const result = await geocodeAddress(order.customerLocationPrecise);
      if (result) setDestinationLocation(result);
    };

    initDestination();
  }, [
    isOpen,
    order.customerLocationPrecise,
    order.customerLat,
    order.customerLng,
    geocodeAddress,
  ]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current || !destinationLocation)
      return;

    try {
      const map = L.map(mapRef.current).setView(
        [destinationLocation.lat, destinationLocation.lng],
        13,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapInitialized(true);

      destinationMarkerRef.current = L.marker(
        [destinationLocation.lat, destinationLocation.lng],
        { icon: destinationIcon },
      )
        .addTo(map)
        .bindPopup("Destination")
        .openPopup();
    } catch (error) {
      console.error("❌ Error initializing map:", error);
      setMapError("Failed to initialize map");
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        setMapInitialized(false);
      }
    };
  }, [destinationLocation, destinationIcon]);

  // Update rider marker and calculate route
  const updateRiderMarker = useCallback(
    (location: { lat: number; lng: number }) => {
      if (!leafletMapRef.current || !destinationLocation) return;

      const map = leafletMapRef.current;

      // Update or create rider marker
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        riderMarkerRef.current = L.marker([location.lat, location.lng], {
          icon: riderIcon,
        })
          .addTo(map)
          .bindPopup("Rider Location");
      }

      // Remove existing routing control
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (error) {
          console.warn("Error removing routing control:", error);
        }
        routingControlRef.current = null;
      }

      // Create new routing control
      try {
        if ((L as any).Routing) {
          const routingControl = (L as any).Routing.control({
            waypoints: [
              L.latLng(location.lat, location.lng),
              L.latLng(destinationLocation.lat, destinationLocation.lng),
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            lineOptions: {
              styles: [{ color: "#E97474", opacity: 0.8, weight: 5 }],
            },
            createMarker: () => null,
          }).addTo(map);

          routingControlRef.current = routingControl;

          routingControl.on("routesfound", (e: any) => {
            const routes = e.routes;
            if (routes?.[0]?.summary) {
              const summary = routes[0].summary;
              const totalSeconds = Math.round(summary.totalTime);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              setEta(
                hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`,
              );
              setDistance(`${(summary.totalDistance / 1000).toFixed(1)} km`);
            }
          });
        }

        // Fit bounds to show both points
        const bounds = L.latLngBounds([
          [location.lat, location.lng],
          [destinationLocation.lat, destinationLocation.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.error("Error creating route:", error);
        const bounds = L.latLngBounds([
          [location.lat, location.lng],
          [destinationLocation.lat, destinationLocation.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    },
    [destinationLocation, riderIcon],
  );

  // Update rider marker when location changes
  useEffect(() => {
    if (riderLocation && destinationLocation && mapInitialized) {
      updateRiderMarker(riderLocation);
    }
  }, [riderLocation, destinationLocation, mapInitialized, updateRiderMarker]);

  // WebSocket connection with stable reconnect logic
  useEffect(() => {
    if (!isOpen || !order.id || !userId) return;

    // Reset the closing flag whenever we (re-)open the connection
    isClosingRef.current = false;

    const connectWebSocket = () => {
      // Bail out if we're intentionally tearing down — prevents the stale-closure
      // reconnect loop where onclose would fire after unmount/isOpen flip and
      // schedule another connection.
      if (isClosingRef.current) return;

      const wsUrl = `wss://otonav-backend.onrender.com?orderId=${order.id}&userId=${userId}&role=owner`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setWsError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: LocationUpdate = JSON.parse(event.data);
          if (data.type === "location_update" && data.location) {
            setRiderLocation(data.location);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
        setWsError("Connection failed");
      };

      ws.onclose = (event) => {
        setWsConnected(false);

        // Only schedule a reconnect when the close was NOT intentional and NOT
        // a clean close (code 1000). Reading isClosingRef here avoids the stale
        // `isOpen` closure value that caused the original flicker loop.
        if (!isClosingRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      // Signal intentional close BEFORE calling ws.close() so the onclose
      // handler sees the flag and skips scheduling a reconnect.
      isClosingRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [isOpen, order.id, userId]);

  // Fall back to saved rider location if WebSocket provides nothing after 5s
  useEffect(() => {
    if (!isOpen || !destinationLocation) return;

    const timer = setTimeout(() => {
      if (!riderLocation && order.riderCurrentLocation) {
        try {
          let lat = 0,
            lng = 0;
          if (
            typeof order.riderCurrentLocation === "object" &&
            order.riderCurrentLocation !== null
          ) {
            lat = (order.riderCurrentLocation as any).lat;
            lng = (order.riderCurrentLocation as any).lng;
          } else if (typeof order.riderCurrentLocation === "string") {
            const coords = order.riderCurrentLocation
              .replace(/[\[\]\s]/g, "")
              .split(",")
              .map(Number);
            if (coords.length === 2) {
              lat = coords[0];
              lng = coords[1];
            }
          }
          if (lat && lng) {
            setRiderLocation({ lat, lng });
          }
        } catch (error) {
          console.error("Error parsing saved rider location:", error);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, destinationLocation, riderLocation, order.riderCurrentLocation]);

  const handleRetryGeocoding = async () => {
    if (!order.customerLocationPrecise) return;
    const result = await geocodeAddress(order.customerLocationPrecise);
    if (result) {
      setDestinationLocation(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E97474]/10 rounded-xl">
              <Navigation className="text-[#E97474]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Track Order #{order.orderNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Real-time delivery tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-xs font-medium text-gray-600">
                {wsConnected
                  ? "Live tracking active"
                  : wsError
                    ? "Connection failed"
                    : "Connecting..."}
              </span>
              {wsError && (
                <span className="text-xs text-red-600 ml-2">
                  (Using saved location if available)
                </span>
              )}
            </div>
            {isGeocoding && (
              <span className="text-xs text-gray-500 animate-pulse">
                Finding location... (attempt {geocodingAttempts})
              </span>
            )}
            {eta && distance && (
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#E97474]" />
                  <span className="font-medium">{eta}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#00A082]" />
                  <span className="font-medium">{distance}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[400px] bg-gray-100">
          {mapError && !destinationLocation ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white/90">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <p className="text-gray-700 mb-2 text-center">{mapError}</p>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Address: {order.customerLocationPrecise}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetryGeocoding}
                  disabled={isGeocoding}
                  className="px-4 py-2 bg-[#00A082] text-white text-sm rounded-lg hover:bg-[#00A082]/90 transition-colors disabled:opacity-50"
                >
                  {isGeocoding ? "Retrying..." : "Retry Geocoding"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !destinationLocation ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E97474] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Finding location:{" "}
                  {order.customerLocationPrecise?.substring(0, 50)}...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: "400px" }}
              />
              {!riderLocation && (
                <div className="absolute bottom-4 left-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <WifiOff size={16} className="text-amber-600" />
                    <p className="text-xs text-amber-800">
                      Waiting for rider location update...{" "}
                      {!wsConnected && "(Connection issue)"}
                    </p>
                  </div>
                </div>
              )}
              {geocodingAttempts > 1 && (
                <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-800 font-medium">Note</p>
                      <p className="text-xs text-amber-700">
                        Using approximate location
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Cards */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl border border-red-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#E97474]/10 rounded-lg">
                  <Bike className="text-[#E97474]" size={18} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rider
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {order.rider?.name || "Not assigned"}
              </p>
              {order.rider?.phoneNumber && (
                <p className="text-xs text-gray-500 mt-1">
                  {order.rider.phoneNumber}
                </p>
              )}
              {riderLocation && (
                <p className="text-xs text-gray-400 mt-1">
                  Active: {riderLocation.lat.toFixed(4)},{" "}
                  {riderLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="text-blue-600" size={18} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Package
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {order.packageDescription || "No description"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#00A082]/10 rounded-lg">
                  <MapPin className="text-[#00A082]" size={18} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Destination
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {order.customerLocationPrecise || "Not specified"}
              </p>
              {destinationLocation && (
                <p className="text-xs text-gray-400 mt-1">
                  {destinationLocation.lat.toFixed(4)},{" "}
                  {destinationLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
