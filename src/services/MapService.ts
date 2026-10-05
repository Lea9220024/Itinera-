import { ActivityCategory } from '../types';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  label?: string;
  category?: ActivityCategory;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface IMapService {
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
  getBounds(points: GeoPoint[]): MapBounds;
  getCategoryTheme(category: ActivityCategory): {
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    iconName: string;
  };
  getCityCoordinates(cityName: string): { latitude: number; longitude: number };
}

class DecoupledMapService implements IMapService {
  private cityMap: Record<string, { latitude: number; longitude: number }> = {
    roma: { latitude: 41.9028, longitude: 12.4964 },
    rome: { latitude: 41.9028, longitude: 12.4964 },
    florencia: { latitude: 43.7696, longitude: 11.2558 },
    firenze: { latitude: 43.7696, longitude: 11.2558 },
    florence: { latitude: 43.7696, longitude: 11.2558 },
    venecia: { latitude: 45.4408, longitude: 12.3155 },
    venezia: { latitude: 45.4408, longitude: 12.3155 },
    venice: { latitude: 45.4408, longitude: 12.3155 },
    milan: { latitude: 45.4642, longitude: 9.19 },
    milano: { latitude: 45.4642, longitude: 9.19 },
    barcelona: { latitude: 41.3851, longitude: 2.1734 },
    madrid: { latitude: 40.4168, longitude: -3.7038 },
    paris: { latitude: 48.8566, longitude: 2.3522 },
    tokyo: { latitude: 35.6762, longitude: 139.6503 },
    'buenos aires': { latitude: -34.6037, longitude: -58.3816 },
  };

  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  getBounds(points: GeoPoint[]): MapBounds {
    if (points.length === 0) {
      return { minLat: 41.8, maxLat: 45.5, minLng: 9.1, maxLng: 12.5 };
    }
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;

    for (const p of points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    // Add 15% padding
    const latSpan = Math.max(maxLat - minLat, 0.02);
    const lngSpan = Math.max(maxLng - minLng, 0.02);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }

  getCategoryTheme(category: ActivityCategory) {
    switch (category) {
      case 'gastronomy':
        return {
          color: '#d97706',
          bgColor: '#fef3c7',
          borderColor: '#f59e0b',
          label: 'Gastronomía',
          iconName: 'Utensils',
        };
      case 'culture':
        return {
          color: '#059669',
          bgColor: '#d1fae5',
          borderColor: '#10b981',
          label: 'Cultura e Historia',
          iconName: 'Landmark',
        };
      case 'sightseeing':
        return {
          color: '#0284c7',
          bgColor: '#e0f2fe',
          borderColor: '#38bdf8',
          label: 'Punto de Interés',
          iconName: 'Eye',
        };
      case 'transport':
        return {
          color: '#7c3aed',
          bgColor: '#ede9fe',
          borderColor: '#8b5cf6',
          label: 'Transporte / Estación',
          iconName: 'Train',
        };
      case 'lodging':
        return {
          color: '#db2777',
          bgColor: '#fce7f3',
          borderColor: '#ec4899',
          label: 'Hotel / Alojamiento',
          iconName: 'Hotel',
        };
      case 'relaxation':
        return {
          color: '#0d9488',
          bgColor: '#ccfbf1',
          borderColor: '#14b8a6',
          label: 'Relax',
          iconName: 'Coffee',
        };
      case 'shopping':
        return {
          color: '#ea580c',
          bgColor: '#ffedd5',
          borderColor: '#f97316',
          label: 'Compras',
          iconName: 'ShoppingBag',
        };
      case 'nature':
        return {
          color: '#16a34a',
          bgColor: '#dcfce7',
          borderColor: '#22c55e',
          label: 'Naturaleza',
          iconName: 'Trees',
        };
      case 'adventure':
      default:
        return {
          color: '#4f46e5',
          bgColor: '#e0e7ff',
          borderColor: '#6366f1',
          label: 'Aventura / Actividad',
          iconName: 'Compass',
        };
    }
  }

  getCityCoordinates(cityName: string): { latitude: number; longitude: number } {
    const key = cityName.toLowerCase().trim();
    return this.cityMap[key] || { latitude: 41.9028, longitude: 12.4964 };
  }
}

export const MapService: IMapService = new DecoupledMapService();
