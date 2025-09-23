// hooks/cards.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";

/** Mobile form shape */
export type CardPayload = {
  personal: {
    name: string;
    designation: string;
    contact: string;
    email: string;
    website: string;
    location: string;
    mapsLink: string;
  };
  business: {
    companyName: string;
    companyContact: string;
    companyEmail: string;
    companyWebsite: string;
    companyAddress: string;
    companyMapsLink: string;
    message: string;
  };
  social: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string; // use wa.me link
    telegram?: string;
  };
};

/** Flatten to match typical REST backend (single doc) */
const flatten = (p: CardPayload) => ({
  // Personal
  name: p.personal.name,
  designation: p.personal.designation,
  contact: p.personal.contact,
  email: p.personal.email,
  website: p.personal.website,
  location: p.personal.location,
  mapsLink: p.personal.mapsLink,
  // Business
  companyName: p.business.companyName,
  companyContact: p.business.companyContact,
  companyEmail: p.business.companyEmail,
  companyWebsite: p.business.companyWebsite,
  companyAddress: p.business.companyAddress,
  companyMapsLink: p.business.companyMapsLink,
  message: p.business.message,
  // Social
  linkedin: p.social.linkedin,
  twitter: p.social.twitter,
  instagram: p.social.instagram,
  facebook: p.social.facebook,
  youtube: p.social.youtube,
  whatsapp: p.social.whatsapp,
  telegram: p.social.telegram,
});

export function useCards(p0: { page: number; limit: number; }) {
  return useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      await ensureAuth();                 // <-- adds token
      // your backend uses GET /api/cards (requires auth)
      return api.get("/cards");
    },
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CardPayload) => {
      await ensureAuth();                 // <-- adds token
      // create: POST /api/cards
      return api.post("/cards", flatten(payload));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
