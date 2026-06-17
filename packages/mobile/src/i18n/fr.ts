/** Chaînes françaises du parcours multi-agent (epics, sprints, tâches, projets). */
export const fr: Record<string, string> = {
  // Commun
  "common.cancel": "Annuler",
  "common.delete": "Supprimer",
  "common.edit": "Modifier",
  "common.archive": "Archiver",
  "common.restore": "Restaurer",
  "common.error": "Erreur",
  "common.active": "Actifs",
  "common.archived": "Archivés",

  // Assistant de décomposition d'epic
  "epicDecomp.title": "Décomposer un PRD",
  "epicDecomp.epicName": "Nom de l'epic",
  "epicDecomp.epicNamePlaceholder": "ex. Facturation v2",
  "epicDecomp.prd": "Cahier des charges (PRD)",
  "epicDecomp.prdPlaceholder":
    "Collez un cahier des charges — objectifs, fonctionnalités, contraintes…",
  "epicDecomp.credential": "Identifiant",
  "epicDecomp.noCredential":
    "Ajoutez un identifiant Claude par défaut dans les Réglages avant de décomposer.",
  "epicDecomp.hint":
    "Crée l'epic maintenant et rédige ses sprints et tâches en arrière-plan — ils apparaissent automatiquement quand le plan est prêt.",
  "epicDecomp.submit": "Décomposer avec l'IA",
  "epicDecomp.submitting": "Lancement…",
  "epicDecomp.failed":
    "Échec du lancement de la décomposition (machine hors ligne ?).",

  // Carte + détail d'epic
  "epic.decompPending": "En file",
  "epic.decompRunning": "Décomposition…",
  "epic.decompCompleted": "Décomposé",
  "epic.decompFailed": "Échec",
  "epic.decompFailedLong": "Échec de la décomposition",
  "epic.actions": "Actions de l'epic",
  "epic.pr": "PR",
  "epic.prNumbered": "PR #{number}",
  "epic.prMerged": "fusionnée",
  "epic.prClosed": "fermée",
  "epic.tasksDone": "faites",
  "epic.tasksRemaining": "restantes",
  "epic.detailTasks": "tâches",
  "epic.detailNoDescription": "Aucune description.",
  "epic.detailNoTasks": "Aucune tâche",
  "epic.detailNoTasksRunning":
    "La décomposition rédige encore les tâches — elles apparaissent dès qu'elles sont prêtes.",
  "epic.detailNoTasksIdle": "Cet epic n'a pas encore de tâche.",
  "epic.notFound": "Epic introuvable.",
  "epic.loading": "Chargement de l'epic...",

  // Tableau des epics
  "epicsBoard.noEpicsTitle": "Aucun epic",
  "epicsBoard.noEpicsDesc":
    "Décomposez un PRD pour générer un epic avec ses sprints et ses tâches.",
  "epicsBoard.noEpicsAction": "Décomposer un PRD",
  "epicsBoard.noArchivedTitle": "Aucun epic archivé",
  "epicsBoard.noArchivedDesc": "Les epics que vous archivez apparaîtront ici.",
  "epicsBoard.statTotal": "total",
  "epicsBoard.statInProgress": "en cours",
  "epicsBoard.statDone": "faits",
  "epicsBoard.archiveFailed": "Échec de l'archivage de l'epic",
  "epicsBoard.restoreFailed": "Échec de la restauration de l'epic",
  "epicsBoard.deleteFailed": "Échec de la suppression de l'epic",
  "epicsBoard.deleteTitle": "Supprimer l'epic",
  "epicsBoard.deleteConfirm": "Supprimer « {name} » ? Action irréversible.",

  // Carte + tableau de sprint
  "sprint.actions": "Actions du sprint",
  "sprint.start": "Démarrer le sprint",
  "sprint.complete": "Terminer le sprint",
  "sprint.new": "Nouveau sprint",
  "sprint.editTitle": "Modifier le sprint",
  "sprint.nameLabel": "Nom",
  "sprint.namePlaceholder": "ex. Sprint 4",
  "sprint.goalLabel": "Objectif",
  "sprint.goalPlaceholder": "Que doit accomplir ce sprint ?",
  "sprint.startDateLabel": "Début (AAAA-MM-JJ)",
  "sprint.endDateLabel": "Fin (AAAA-MM-JJ)",
  "sprint.capacityLabel": "Capacité (story points)",
  "sprint.capacityPlaceholder": "ex. 40",
  "sprint.saveChanges": "Enregistrer",
  "sprint.createSprint": "Créer le sprint",
  "sprint.saving": "Enregistrement…",
  "sprint.nameRequired": "Le nom est requis",
  "sprint.startDateInvalid": "La date de début doit être AAAA-MM-JJ",
  "sprint.endDateInvalid": "La date de fin doit être AAAA-MM-JJ",
  "sprint.capacityInvalid": "La capacité doit être un nombre",
  "sprint.saveFailed": "Échec de l'enregistrement du sprint",
  "sprint.startTitle": "Démarrer le sprint",
  "sprint.startConfirm": "Démarrer « {name} » ? Il passera au statut actif.",
  "sprint.startAction": "Démarrer",
  "sprint.startFailed": "Échec du démarrage du sprint. Réessayez.",
  "sprint.completeTitle": "Terminer le sprint",
  "sprint.completeConfirm":
    "Terminer « {name} » ? Les tâches inachevées resteront au backlog.",
  "sprint.completeAction": "Terminer",
  "sprint.completeFailed": "Échec de la clôture du sprint. Réessayez.",
  "sprint.deleteTitle": "Supprimer le sprint",
  "sprint.deleteConfirm": "Supprimer « {name} » ? Action irréversible.",
  "sprint.deleteFailed": "Échec de la suppression du sprint.",
  "sprint.featuredActive": "Actif",
  "sprint.details": "Détails",
  "sprint.startBtn": "Démarrer le sprint",
  "sprint.completeBtn": "Terminer le sprint",
  "sprint.otherSprints": "Autres sprints",
  "sprint.noSprintsTitle": "Aucun sprint",
  "sprint.noSprintsDesc":
    "Créez un sprint pour suivre le travail de l'équipe en itérations limitées dans le temps.",
  "sprint.daysLeft": "{n}j restants",
  "sprint.daysOver": "{n}j de retard",

  // Création / édition de projet
  "project.newTitle": "Nouveau projet multi-agent",
  "project.editTitle": "Modifier le projet",
  "project.newSubtitle":
    "Créez un projet partagé pour coordonner plusieurs instances Claude",
  "project.editSubtitle":
    "Mettez à jour le nom et le contexte partagé du projet",
  "project.machineLabel": "Machine",
  "project.machineHint":
    "Seules les machines en ligne peuvent héberger un nouveau projet",
  "project.machineRequired": "Veuillez sélectionner une machine",
  "project.machineLoading": "Chargement des machines…",
  "project.machinePlaceholder": "Sélectionnez une machine…",
  "project.pathLabel": "Chemin du projet",
  "project.pathHint":
    "Chemin absolu sur la machine hôte, ex. /home/user/mon-projet",
  "project.pathRequired": "Le chemin du projet est requis",
  "project.browse": "Parcourir",
  "project.scan": "Scanner",
  "project.scanning": "Analyse…",
  "project.scanFailed": "Échec de l'analyse",
  "project.nameLabel": "Nom du projet",
  "project.nameHintCreate":
    "Généré depuis le chemin — vous pouvez le personnaliser",
  "project.nameHintEdit": "Renommer le projet",
  "project.nameRequired": "Le nom du projet est requis",
  "project.summaryLabel": "Résumé",
  "project.summaryHint": "Facultatif — brève description du projet",
  "project.summaryPlaceholder": "Que fait ce projet ?",
  "project.architectureLabel": "Architecture",
  "project.architectureHint":
    "Facultatif — structure générale, couches, modules clés",
  "project.architecturePlaceholder": "Comment le projet est-il structuré ?",
  "project.conventionsLabel": "Conventions",
  "project.conventionsHint":
    "Facultatif — standards de code, patterns, à faire / à éviter",
  "project.conventionsPlaceholder": "Nommage, style, conventions de test…",
  "project.currentFocusLabel": "Focus actuel",
  "project.currentFocusHint":
    "Facultatif — ce sur quoi l'équipe travaille en ce moment",
  "project.currentFocusPlaceholder":
    "Objectif du sprint en cours ou axe de travail…",
  "project.recentChangesLabel": "Changements récents",
  "project.recentChangesHint":
    "Facultatif — changements récents notables à partager",
  "project.recentChangesPlaceholder": "Qu'est-ce qui a changé récemment ?",
  "project.createBtn": "Créer le projet",
  "project.saveBtn": "Enregistrer",
  "project.createFailed": "Échec de la création du projet",
  "project.editFailed": "Échec de la mise à jour du projet",
  "project.actions": "Actions du projet",
  "project.archiveTitle": "Archiver le projet",
  "project.archiveConfirm":
    "Archiver « {name} » ? C'est réversible — rien n'est supprimé et vous pouvez le restaurer depuis la section Archivés.",
  "project.archiveFailed": "Échec de l'archivage du projet",
};
