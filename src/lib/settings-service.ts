
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { merge } from 'lodash';

// --- Appearance Settings ---
export interface AppearanceSettings {
    primary: string;
    background: string;
    accent: string;
}

// --- General Settings ---
export interface GeneralSettings {
    siteName: string;
    contactEmail: string;
    allowCountryChange: boolean;
}

// --- Chat Settings ---
export interface WhatsappConfig {
    enabled: boolean;
    phoneNumber: string;
    predefinedMessage: string;
    iconUrl: string;
}

export interface LiveChatConfig {
    enabled: boolean;
    chatTitle: string;
    assistantName: string;
    welcomeMessage: string;
    isOnline: boolean;
    requestUserInfo: boolean;
    iconUrl: string;
    notificationColor: string;
}

export interface ChatSettings {
    whatsapp: WhatsappConfig;
    liveChat: LiveChatConfig;
}

// --- Hero Settings ---
export interface HeroSettings {
    title: string;
    subtitle: string;
    buttonText: string;
    mediaType: 'image' | 'video' | 'youtube';
    mediaUrl: string;
    /** The opacity of the background media, stored as a value from 0 to 1. */
    mediaOpacity: number;
}

// --- Header Settings ---
export interface HeaderLink {
    text: string;
    href: string;
}
export interface HeaderSettings {
    links: HeaderLink[];
}

// --- Footer Settings ---
export interface FooterLink {
    text: string;
    href: string;
}
export interface FooterColumn {
    title: string;
    links: FooterLink[];
}
export interface FooterContact {
    email: string;
    phone: string;
    address: string;
}

export interface FooterSocial {
    twitter: string;
    facebook: string;
    instagram: string;
}

export interface FooterSettings {
    newsletterText: string;
    columns: FooterColumn[];
    contact: FooterContact;
    social: FooterSocial;
    copyrightText: string;
    developerName?: string;
    developerUrl?: string;
}

// --- Map Settings ---
export interface MapSettings {
    lat: number;
    lng: number;
    showOverlay: boolean;
    overlayTitle: string;
    overlayAddress: string;
}


// --- Main App Settings Interface ---
export interface AppSettings {
    appearance: AppearanceSettings;
    general: GeneralSettings;
    chat: ChatSettings;
    hero: HeroSettings;
    header: HeaderSettings;
    footer: FooterSettings;
    map: MapSettings;
}

const settingsDocRef = doc(db, 'app-config', 'main');

/**
 * Saves settings to Firestore. It deep merges the new settings with existing ones.
 * @param newSettings - The settings object to save.
 */
export const saveSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
        const existingDoc = await getDoc(settingsDocRef);
        const existingSettings = existingDoc.exists() ? existingDoc.data() : {};
        
        // Use lodash merge for deep merging, which is better for nested objects
        const mergedSettings = merge({}, existingSettings, newSettings);

        const finalSettings = {
            ...mergedSettings,
            updatedAt: serverTimestamp()
        };
        
        // Use set with merge:true, although lodash merge handles the logic, 
        // this is an extra safeguard.
        await setDoc(settingsDocRef, finalSettings, { merge: true });

    } catch (error) {
        console.error("Error saving settings: ", error);
        throw new Error("Could not save settings.");
    }
};

/**
 * Retrieves settings from Firestore.
 * @returns The settings object or null if it doesn't exist.
 */
export const getSettings = async (): Promise<AppSettings | null> => {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppSettings;
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings: ", error);
        throw new Error("Could not fetch settings.");
    }
};
