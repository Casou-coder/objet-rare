/**
 * Textes V1. Les textes marqués [doc] sont repris mot pour mot des documents (wording figé).
 * Les autres sont rédigés au plus sobre pour des écrans que les documents ne détaillent pas.
 */
const v1fr = {
  v: {
    common: {
      retry: 'Réessayer', // [doc]
      cancel: 'Annuler',
      back: 'Retour',
      continue: 'Continuer',
      close: 'Fermer',
      loading: 'Chargement…',
      networkError: 'Une erreur est survenue. Réessayez.', // [doc] Mon compte
      optional: 'facultatif',
    },
    errors: {
      FREE_LIMIT_REACHED: 'Limite d’objets atteinte. Passez en Premium.', // [doc]
      DUPLICATE_CERTIFICATE: 'Ce certificat est déjà associé à un objet existant.', // [doc]
      DUPLICATE_DOCUMENT: 'Ce document est déjà associé à un objet existant.', // [doc]
      UNIQUE_ID_CONFLICT: 'Un conflit d’unicité a été détecté.', // [doc]
      CERTIFICATE_NOT_READABLE: 'Ce document n’est pas suffisamment lisible.', // [doc]
      VALIDATION_ERROR: 'Certaines informations sont invalides.',
      NOT_FOUND: 'Cet élément n’est plus disponible.',
      UNAUTHORIZED: 'Votre session a expiré. Reconnectez-vous.',
      FORBIDDEN: 'Action non autorisée.',
      NETWORK: 'Connexion impossible. Vérifiez votre réseau.',
      INTERNAL: 'Une erreur est survenue. Réessayez.', // [doc]
      conflictSupport: 'Vous pouvez contacter le support.',
    },
    tabs: {
      collection: 'Ma collection',
      vault: 'Mon coffre',
      documents: 'Documents',
      account: 'Compte',
    },
    auth: {
      title: 'Connexion',
      devNotice: 'Connexion de développement : saisissez une adresse e-mail pour ouvrir une session de test.',
      email: 'Adresse e-mail',
      submit: 'Se connecter',
      invalidEmail: 'Adresse e-mail invalide.',
    },
    profile: {
      title: 'Compléter votre profil',
      body: 'Votre nom complet est nécessaire pour ajouter un objet.',
      label: 'Nom complet',
      submit: 'Enregistrer',
      tooShort: 'Saisissez votre nom complet.',
    },
    collection: {
      title: 'Ma collection',
      empty: 'Votre collection est vide.', // [doc]
      emptyCta: 'Ajouter un premier objet', // [doc]
      error: 'Impossible de charger votre collection.', // [doc]
      sortRecent: 'Date d’ajout (récent → ancien)', // [doc]
      sortOldest: 'Date d’ajout (ancien → récent)', // [doc]
    },
    vault: {
      title: 'Mon coffre',
      empty: 'Aucun objet dans votre coffre.', // [doc]
      emptyCta: 'Ajouter un objet', // [doc]
      error: 'Certaines informations n’ont pas pu être chargées.', // [doc]
      valueUnavailable: 'Valeur indisponible', // [doc]
      lastUpdate: 'Dernière mise à jour : {{date}}', // [doc]
      status: {
        missing_document: 'Document manquant', // [doc]
        unreadable: 'Document illisible', // [doc]
        conflict: 'Conflit détecté', // [doc]
      },
      limitReached: 'Vous avez atteint la limite de 3 objets.', // [doc] Mon compte
      goPremium: 'Passer à Premium', // [doc]
    },
    documents: {
      title: 'Documents',
      certificates: 'Certificats',
      insurances: 'Assurances',
      empty: 'Aucun document enregistré.', // [doc]
      emptyCta: 'Ajouter un objet', // [doc]
      error: 'Impossible de charger vos documents.', // [doc]
      actionRequired: 'Action requise', // [doc]
      certificate: 'Certificat d’authenticité', // [doc]
      insurance: 'Contrat d’assurance', // [doc]
      invoice: 'Facture',
      maintenance: 'Entretien',
      other: 'Autre document',
      locked: 'Accès réservé à Premium',
      addInsurance: 'Ajouter un contrat d’assurance',
      addOther: 'Ajouter un autre document',
    },
    categories: {
      watch: 'Montre', // [doc]
      handbag: 'Sac à main', // [doc]
      sneaker: 'Sneakers', // [doc]
      certified_other: 'Autre objet certifié', // [doc]
    },
    passport: {
      proofTitle: 'Preuve & documents',
      certificateProvided: 'Certificat fourni', // [doc]
      idRegistered: 'Identifiant enregistré', // [doc]
      readable: 'Document lisible', // [doc]
      holderDetected: 'Nominatif détecté', // [doc]
      holderConfirmed: 'Nominatif confirmé', // [doc]
      holderNotDetected: 'Nominatif non détecté', // [doc] ITEM_FORM
      unreadable: 'Le document fourni n’est pas suffisamment lisible.', // [doc]
      info: 'L’application centralise les documents fournis par l’utilisateur. Elle ne réalise pas d’expertise ni de certification de l’objet.', // [doc]
      valueTitle: 'Valeur',
      acquisitionPrice: 'Prix d’acquisition (fourni par l’utilisateur)', // [doc]
      marketValue: 'Valeur de marché indicative', // [doc]
      lastUpdate: 'Date de dernière mise à jour', // [doc]
      updating: 'Mise à jour en cours',
      disclaimer: 'Valeur indicative basée sur des sources de marché publiques. Elle ne constitue ni une expertise ni une recommandation.', // [doc]
      history: 'Historique',
      historyLimited: 'Historique complet avec Premium',
      documentsTitle: 'Documents',
      identifier: 'Identifiant unique',
      reference: 'Référence',
      acquisitionDate: 'Date d’acquisition',
      deleteItem: 'Supprimer l’objet',
      error: 'Impossible de charger cet objet.',
    },
    add: {
      methodTitle: 'Ajouter un objet',
      methodInfo: 'L’ajout d’un objet nécessite un certificat nominatif. Les documents fournis servent de preuve et engagent votre responsabilité.', // [doc]
      manual: 'Ajouter manuellement', // [doc]
      qr: 'Scanner un QR code', // [doc]
      photo: 'Photographier un certificat', // [doc]
      categoryTitle: 'Choix de la catégorie',
      noOtherTypes: 'Aucun type d’objet n’est encore disponible dans cette catégorie.',
      formTitle: 'Informations et certificat',
      identity: 'Identité de l’objet',
      brand: 'Marque',
      model: 'Modèle',
      designation: 'Désignation',
      reference: 'Référence',
      serialNumber: 'Numéro de série',
      authCode: 'Code d’authenticité',
      sku: 'SKU',
      size: 'Taille',
      orderId: 'N° de commande',
      uniqueId: 'Identifiant unique',
      otherType: 'Type d’objet',
      acquisition: 'Acquisition',
      price: 'Prix d’acquisition',
      currency: 'Devise',
      date: 'Date d’acquisition (AAAA-MM-JJ)',
      certificate: 'Certificat',
      certificateType: 'Type de document',
      issuer: 'Source du certificat',
      certificateId: 'ID du certificat',
      certTypes: { card: 'Carte', certificate: 'Certificat', invoice: 'Facture', marketplace: 'Marketplace', third_party: 'Tiers' },
      takePhoto: 'Photographier',
      importFile: 'Importer (PDF / image)',
      captureTip: 'Placez le document à plat, bien éclairé, en entier dans le cadre.',
      checking: 'Vérification du document…',
      certificateOk: 'Certificat fourni',
      rescan: 'Rescanner', // [doc]
      manualEntry: 'Saisir manuellement', // [doc]
      prefilled: 'Champs préremplis à partir du document. Vérifiez-les.',
      photoTitle: 'Photo de l’objet',
      addPhoto: 'Ajouter une photo',
      changePhoto: 'Changer la photo',
      required: 'Champ obligatoire',
      missingCertificate: 'Ajoutez un certificat lisible pour continuer.',
      reviewTitle: 'Vérification & confirmation',
      declaration: 'En confirmant, vous déclarez être le propriétaire de l’objet et attestez de l’exactitude des informations et documents fournis.', // [doc]
      confirm: 'Confirmer l’ajout', // [doc]
      networkError: 'Impossible de finaliser l’ajout. Réessayez.', // [doc]
      qrTitle: 'Scanner un QR code',
      qrPermission: 'L’accès à l’appareil photo est nécessaire pour scanner un QR code.',
      qrAllow: 'Autoriser',
    },
    deleteItem: {
      title: 'Supprimer l’objet',
      body: 'La suppression est immédiate et définitive : objet, certificat, documents et historique de valeur.',
      reason: 'Motif',
      reasons: {
        lost: 'Objet perdu', // [doc]
        stolen: 'Objet volé', // [doc]
        sold: 'Objet vendu', // [doc]
        given: 'Objet cédé / donné', // [doc]
        destroyed: 'Objet détruit', // [doc]
        other: 'Autre', // [doc]
      },
      otherPlaceholder: 'Précisez',
      submit: 'Supprimer définitivement',
    },
    viewer: {
      error: 'Impossible d’afficher le document.',
      rotate: 'Pivoter',
      page: 'Page {{page}} / {{total}}',
    },
    account: {
      title: 'Mon compte',
      subscription: 'Abonnement',
      planFree: 'Free',
      planPremium: 'Premium',
      freeLimits: 'Maximum 3 objets · Accès limité à l’historique', // [doc]
      goPremium: 'Passer à Premium', // [doc]
      manage: 'Gérer mon abonnement', // [doc]
      privacy: 'Données & confidentialité',
      privacyText: 'Vos données sont privées et stockées de manière sécurisée.', // [doc]
      privacyPolicy: 'Politique de confidentialité', // [doc]
      terms: 'Conditions d’utilisation', // [doc]
      support: 'Support',
      supportText: 'Une question sur un document ou un objet ? Contactez-nous.', // [doc]
      contactSupport: 'Contacter le support', // [doc]
      deleteTitle: 'Suppression du compte',
      deleteText: 'La suppression du compte entraîne la suppression définitive de toutes vos données.', // [doc]
      deleteCta: 'Supprimer mon compte', // [doc]
      deleteWarning: 'La suppression de votre compte est définitive. Tous vos objets, documents et informations seront supprimés sans possibilité de récupération.', // [doc]
      deleteConfirm: 'Supprimer définitivement', // [doc]
      signOut: 'Se déconnecter',
      objects: 'Objets',
      documents: 'Documents',
      language: 'Langue',
    },
  },
};

export default v1fr;
