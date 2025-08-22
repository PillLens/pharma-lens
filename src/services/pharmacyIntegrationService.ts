import { supabase } from '@/integrations/supabase/client';

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  services: string[];
  verified: boolean;
  distance?: number;
}

export interface MedicationAvailability {
  medicationId: string;
  medicationName: string;
  genericName?: string;
  available: boolean;
  quantity?: number;
  price?: number;
  lastUpdated: string;
  alternativesAvailable?: Array<{
    name: string;
    price: number;
    isGeneric: boolean;
  }>;
}

export interface PrescriptionStatus {
  prescriptionId: string;
  status: 'pending' | 'processing' | 'ready' | 'dispensed' | 'cancelled';
  pharmacy: Pharmacy;
  medications: Array<{
    name: string;
    quantity: number;
    ready: boolean;
    estimatedReadyTime?: string;
  }>;
  totalCost?: number;
  insuranceCoverage?: {
    covered: boolean;
    copay?: number;
    deductible?: number;
  };
  pickupInstructions?: string;
}

class PharmacyIntegrationService {
  private userLocation: GeolocationCoordinates | null = null;

  // Get user's current location
  async getCurrentLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = position.coords;
          resolve(position.coords);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Find nearby pharmacies
  async findNearbyPharmacies(
    radius: number = 10000, // 10km default
    maxResults: number = 20
  ): Promise<Pharmacy[]> {
    try {
      const location = this.userLocation || await this.getCurrentLocation();
      
      const { data: pharmacies, error } = await supabase
        .from('pharmacy_partners')
        .select('*')
        .eq('verified', true)
        .limit(maxResults);

      if (error) throw error;

      // Calculate distances and filter by radius
      const pharmaciesWithDistance = pharmacies
        .map(pharmacy => {
          const mappedPharmacy = this.mapPharmacyData(pharmacy);
          return {
            ...mappedPharmacy,
            distance: this.calculateDistance(
              location.latitude,
              location.longitude,
              mappedPharmacy.coordinates.latitude,
              mappedPharmacy.coordinates.longitude
            ),
          };
        })
        .filter(pharmacy => (pharmacy.distance || 0) <= radius)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return pharmaciesWithDistance;
    } catch (error) {
      console.error('Error finding nearby pharmacies:', error);
      throw error;
    }
  }

  // Check medication availability at specific pharmacy
  async checkMedicationAvailability(
    pharmacyId: string,
    medicationName: string
  ): Promise<MedicationAvailability> {
    try {
      // This would integrate with pharmacy inventory systems
      // For now, we'll simulate the response
      const availability: MedicationAvailability = {
        medicationId: `med-${Date.now()}`,
        medicationName,
        available: Math.random() > 0.3, // 70% chance available
        quantity: Math.floor(Math.random() * 100) + 1,
        price: Math.random() * 100 + 10,
        lastUpdated: new Date().toISOString(),
      };

      // Add alternatives if main medication is not available
      if (!availability.available) {
        availability.alternativesAvailable = [
          {
            name: `Generic ${medicationName}`,
            price: availability.price! * 0.7,
            isGeneric: true,
          },
          {
            name: `Alternative Brand`,
            price: availability.price! * 1.2,
            isGeneric: false,
          },
        ];
      }

      return availability;
    } catch (error) {
      console.error('Error checking medication availability:', error);
      throw error;
    }
  }

  // Check availability across multiple pharmacies
  async checkAvailabilityAcrossPharmacies(
    medicationName: string,
    maxPharmacies: number = 5
  ): Promise<Array<{ pharmacy: Pharmacy; availability: MedicationAvailability }>> {
    try {
      const nearbyPharmacies = await this.findNearbyPharmacies(15000, maxPharmacies);
      
      const availabilityPromises = nearbyPharmacies.map(async (pharmacy) => ({
        pharmacy,
        availability: await this.checkMedicationAvailability(pharmacy.id, medicationName),
      }));

      const results = await Promise.allSettled(availabilityPromises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .sort((a, b) => {
          // Sort by availability first, then by price
          if (a.availability.available && !b.availability.available) return -1;
          if (!a.availability.available && b.availability.available) return 1;
          return (a.availability.price || 0) - (b.availability.price || 0);
        });
    } catch (error) {
      console.error('Error checking availability across pharmacies:', error);
      throw error;
    }
  }

  // Reserve medication at pharmacy
  async reserveMedication(
    pharmacyId: string,
    medicationName: string,
    quantity: number = 1,
    customerInfo: {
      name: string;
      phone: string;
      email?: string;
    }
  ): Promise<{
    reservationId: string;
    estimatedReadyTime: string;
    holdDuration: string;
    instructions: string;
  }> {
    try {
      // This would integrate with pharmacy reservation systems
      const reservationId = `RES-${Date.now()}`;
      const estimatedReadyTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      // In a real implementation, this would:
      // 1. Check current availability
      // 2. Create reservation in pharmacy system
      // 3. Send confirmation to customer
      // 4. Set up expiration timer

      return {
        reservationId,
        estimatedReadyTime,
        holdDuration: '24 hours',
        instructions: 'Please bring a valid ID and prescription when picking up.',
      };
    } catch (error) {
      console.error('Error reserving medication:', error);
      throw error;
    }
  }

  // Track prescription status
  async trackPrescriptionStatus(prescriptionId: string): Promise<PrescriptionStatus> {
    try {
      // This would integrate with pharmacy management systems
      // Simulating response for now
      const status: PrescriptionStatus = {
        prescriptionId,
        status: 'processing',
        pharmacy: await this.getPharmacyById('pharmacy-1'),
        medications: [
          {
            name: 'Sample Medication',
            quantity: 30,
            ready: false,
            estimatedReadyTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          },
        ],
        totalCost: 45.99,
        insuranceCoverage: {
          covered: true,
          copay: 10.00,
          deductible: 0,
        },
        pickupInstructions: 'Please bring your insurance card and ID.',
      };

      return status;
    } catch (error) {
      console.error('Error tracking prescription status:', error);
      throw error;
    }
  }

  // Get insurance coverage information
  async getInsuranceCoverage(
    medicationName: string,
    insuranceInfo: {
      provider: string;
      memberId: string;
      groupId?: string;
    }
  ): Promise<{
    covered: boolean;
    copay?: number;
    deductible?: number;
    priorAuthRequired: boolean;
    alternatives?: Array<{
      name: string;
      copay: number;
      covered: boolean;
    }>;
  }> {
    try {
      // This would integrate with insurance verification systems
      // Simulating response
      return {
        covered: Math.random() > 0.2, // 80% coverage rate
        copay: Math.random() * 30 + 5,
        deductible: Math.random() > 0.8 ? Math.random() * 100 : 0,
        priorAuthRequired: Math.random() > 0.9,
        alternatives: [
          {
            name: `Generic ${medicationName}`,
            copay: 5,
            covered: true,
          },
        ],
      };
    } catch (error) {
      console.error('Error getting insurance coverage:', error);
      throw error;
    }
  }

  // Calculate price comparison across pharmacies
  async getPriceComparison(
    medicationName: string,
    quantity: number = 30
  ): Promise<Array<{
    pharmacy: Pharmacy;
    price: number;
    withInsurance?: number;
    savings?: number;
    availability: boolean;
  }>> {
    try {
      const pharmacies = await this.findNearbyPharmacies(20000, 10);
      
      const pricePromises = pharmacies.map(async (pharmacy) => {
        const availability = await this.checkMedicationAvailability(pharmacy.id, medicationName);
        const basePrice = availability.price || 0;
        const withInsurance = basePrice * 0.8; // 20% insurance discount simulation
        
        return {
          pharmacy,
          price: basePrice,
          withInsurance,
          savings: basePrice - withInsurance,
          availability: availability.available,
        };
      });

      const results = await Promise.allSettled(pricePromises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('Error getting price comparison:', error);
      throw error;
    }
  }

  // Private helper methods
  private mapPharmacyData(data: any): Pharmacy {
    return {
      id: data.id,
      name: data.name,
      address: data.contact?.address || 'Address not available',
      phone: data.contact?.phone || '',
      email: data.contact?.email,
      coordinates: data.coordinates || { latitude: 0, longitude: 0 },
      operatingHours: data.operating_hours || {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { closed: true, open: '', close: '' },
      },
      services: data.services || ['Prescription Filling', 'Consultation'],
      verified: data.verified || false,
    };
  }

  private async getPharmacyById(id: string): Promise<Pharmacy> {
    const { data, error } = await supabase
      .from('pharmacy_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.mapPharmacyData(data);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return Math.round(d * 1000); // Return distance in meters
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const pharmacyIntegrationService = new PharmacyIntegrationService();