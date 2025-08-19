
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { merge } from 'lodash';
import { Truck, Headset, ShieldCheck, Wrench, BarChart, ShoppingCart } from 'lucide-react';

// --- Appearance Settings ---
export interface AppearanceSettings {
    primary: string;
    background: string;
    accent: string;
    faviconUrl?: string;
}

// --- General Settings ---
export interface GeneralSettings {
    siteName: string;
    displayName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    contactEmail: string;
    allowCountryChange: boolean;
}

// --- Chat Settings ---
export interface Schedule {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

export interface WhatsappConfig {
    enabled: boolean;
    phoneNumber: string;
    predefinedMessage: string;
    iconUrl: string;
    buttonColor?: string;
}

export interface LiveChatConfig {
    enabled: boolean;
    chatTitle: string;
    assistantName: string;
    welcomeMessage: string;
    offlineMessage: string;
    forceOnline: boolean;
    requestUserInfo: boolean;
    iconUrl: string;
    notificationColor: string;
    userBubbleColor?: string;
    schedule?: Schedule[];
}

export interface ChatSettings {
    whatsapp: WhatsappConfig;
    liveChat: LiveChatConfig;
}

// --- Review Settings ---
export interface ReviewSettings {
    policy: 'all' | 'registered' | 'buyers';
    allowMultipleReviews: boolean;
}

// --- Hero Settings ---
export interface HeroSettings {
    title: string;
    subtitle: string;
    backgroundType: 'image' | 'video' | 'youtube';
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
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

export interface SocialLink {
    icon: string;
    href: string;
}

export interface FooterSettings {
    newsletterText: string;
    brandDisplay?: 'logoAndName' | 'logoOnly' | 'nameOnly';
    columns: FooterColumn[];
    contact: FooterContact;
    social: SocialLink[];
    socialIconSize?: number;
    copyrightText: string;
    developerName?: string;
    developerUrl?: string;
    // Legal texts
    aboutUsText?: string;
    privacyPolicyText?: string;
    termsOfServiceText?: string;
}

// --- Map Settings ---
export interface MapSettings {
    lat: number;
    lng: number;
    showOverlay: boolean;
    overlayTitle: string;
    overlayAddress: string;
}

// --- Email Settings ---
export interface EmailTemplate {
    subject: string;
    body: string;
}
export interface EmailSettings {
    adminEmail: string;
    customerPurchase: EmailTemplate;
    adminPurchase: EmailTemplate;
    userRegistration: EmailTemplate;
    adminRegistration: EmailTemplate;
}

// --- Services Text Settings ---
export interface ServiceCardSetting {
    icon: string;
    title: string;
    description: string;
}
export interface ServicesTextSettings {
    mainTitle: string;
    mainDescription: string;
    cards: ServiceCardSetting[];
}

// --- Subscription Settings ---
export interface SubscriptionSettings {
    welcomeEmail: EmailTemplate;
    newsletterEmail: EmailTemplate;
}


// --- Main App Settings Interface ---
export interface AppSettings {
    appearance: AppearanceSettings;
    general: GeneralSettings;
    chat: ChatSettings;
    reviews: ReviewSettings;
    hero: HeroSettings;
    header: HeaderSettings;
    footer: FooterSettings;
    map: MapSettings;
    emails: EmailSettings;
    servicesTexts: ServicesTextSettings;
    subscriptions: SubscriptionSettings;
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


/**
 * Listens for real-time updates to the settings document.
 * @param callback The function to call with the updated settings.
 * @returns An unsubscribe function.
 */
export const onSettingsSnapshot = (callback: (settings: AppSettings | null) => void): (() => void) => {
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as AppSettings);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to settings snapshot: ", error);
        // Optionally, you could pass the error to the callback
        // callback(null, error);
    });

    return unsubscribe;
};
