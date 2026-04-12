<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Politique de Confidentialite</h1>
      <p class="lead">
        La presente Politique de Confidentialite decrit comment QR Communication collecte, utilise,
        stocke et protege vos donnees a caractere personnel dans le cadre de l'utilisation de la
        plateforme ClaudeNest, en conformite avec le Reglement General sur la Protection des Donnees
        (RGPD - Reglement UE 2016/679) et la loi Informatique et Libertes du 6 janvier 1978 modifiee.
      </p>
      <p class="last-updated">Date d'effet : 12 avril 2026</p>
    </header>

    <!-- Table of Contents -->
    <nav class="policy-toc">
      <h2>Sommaire</h2>
      <ol>
        <li><a href="#data-controller">Responsable du traitement</a></li>
        <li><a href="#data-we-collect">Donnees collectees</a></li>
        <li><a href="#legal-basis">Bases legales du traitement</a></li>
        <li><a href="#how-we-use">Finalites du traitement</a></li>
        <li><a href="#data-retention">Durees de conservation</a></li>
        <li><a href="#data-sharing">Partage et sous-traitants</a></li>
        <li><a href="#your-rights">Vos droits au titre du RGPD</a></li>
        <li><a href="#cookies">Cookies et traceurs</a></li>
        <li><a href="#data-security">Mesures de securite</a></li>
        <li><a href="#international-transfers">Transferts internationaux</a></li>
        <li><a href="#childrens-privacy">Mineurs</a></li>
        <li><a href="#policy-changes">Modifications de la politique</a></li>
        <li><a href="#contact-dpo">Contact du DPO</a></li>
      </ol>
    </nav>

    <!-- Section 1: Data Controller -->
    <section id="data-controller">
      <h2 id="data-controller">1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des donnees a caractere personnel collectees via la
        plateforme ClaudeNest est :
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
        <div>
          <h4>QR Communication (SAS)</h4>
          <p>
            SIREN 940 163 496 &mdash; Code APE 73.12Z<br>
            23 rue de Richelieu, 75001 Paris, France<br>
            Email : <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a><br>
            Telephone : <a href="tel:+33188833451">+33 1 88 83 34 51</a>
          </p>
        </div>
      </div>
      <p>
        ClaudeNest est egalement un logiciel open source concu pour l'auto-hebergement. Lorsque
        vous utilisez une instance exploitee par un tiers, ce tiers est le responsable du
        traitement. Veuillez vous referer a sa propre politique de confidentialite.
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>Instances auto-hebergees</h4>
          <p>
            Pour les instances auto-hebergees, le responsable du traitement est l'entite
            exploitant le serveur. La presente politique sert de reference et de modele
            que les operateurs doivent adapter a leurs propres obligations legales.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Data We Collect -->
    <section id="data-we-collect">
      <h2 id="data-we-collect">2. Donnees collectees</h2>
      <p>
        ClaudeNest collecte et traite les categories suivantes de donnees a caractere personnel,
        chacune pour une finalite specifique et documentee.
      </p>

      <h3 id="account-data">2.1 Donnees de compte</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Donnee</th>
              <th>Finalite</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>email</code></td>
              <td>Authentification, identification du compte, recuperation de mot de passe</td>
              <td>Jusqu'a suppression du compte</td>
            </tr>
            <tr>
              <td><code>name</code></td>
              <td>Nom d'affichage dans l'interface et les fonctionnalites collaboratives</td>
              <td>Jusqu'a suppression du compte</td>
            </tr>
            <tr>
              <td><code>password_hash</code></td>
              <td>Authentification securisee (hache bcrypt, jamais stocke en clair)</td>
              <td>Jusqu'a suppression du compte</td>
            </tr>
            <tr>
              <td><code>avatar_url</code></td>
              <td>Affichage du profil (provient des fournisseurs OAuth le cas echeant)</td>
              <td>Jusqu'a suppression du compte</td>
            </tr>
            <tr>
              <td><code>google_id</code> / <code>github_id</code></td>
              <td>Liaison d'authentification OAuth</td>
              <td>Jusqu'a suppression du compte ou deliaison OAuth</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="machine-data">2.2 Donnees machine</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Donnee</th>
              <th>Finalite</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>hostname</code></td>
              <td>Identification de la machine dans le tableau de bord</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>platform</code> / <code>arch</code></td>
              <td>Detection de compatibilite (darwin, win32, linux)</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>agent_version</code></td>
              <td>Suivi de version pour les notifications de mise a jour</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>node_version</code> / <code>claude_version</code></td>
              <td>Verification de compatibilite d'execution</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>claude_path</code></td>
              <td>Localisation du binaire Claude Code sur la machine</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>token_hash</code></td>
              <td>Authentification machine (hache, jamais stocke en clair)</td>
              <td>Jusqu'a suppression de la machine ou regeneration du token</td>
            </tr>
            <tr>
              <td><code>capabilities</code></td>
              <td>Detection des fonctionnalites (JSON)</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
            <tr>
              <td><code>last_seen_at</code> / <code>connected_at</code></td>
              <td>Etat de connexion et surveillance de la disponibilite</td>
              <td>Jusqu'a suppression de la machine</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="session-data">2.3 Donnees de session</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Donnee</th>
              <th>Finalite</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>terminal_output</code></td>
              <td>Affichage temps reel et journaux de session pour consultation</td>
              <td>Configurable (par defaut : 90 jours)</td>
            </tr>
            <tr>
              <td><code>commands / input</code></td>
              <td>Relais d'entrees entre le client et l'agent</td>
              <td>Transitoire (WebSocket uniquement) ou journalise</td>
            </tr>
            <tr>
              <td><code>project_path</code></td>
              <td>Identification du repertoire de travail</td>
              <td>Duree de la session</td>
            </tr>
            <tr>
              <td><code>initial_prompt</code></td>
              <td>Instruction de demarrage de session</td>
              <td>Duree de la session + journaux</td>
            </tr>
            <tr>
              <td><code>pid</code> / <code>exit_code</code></td>
              <td>Gestion du cycle de vie du processus</td>
              <td>Duree de la session + journaux</td>
            </tr>
            <tr>
              <td><code>pty_size</code></td>
              <td>Dimensions du terminal pour un affichage correct</td>
              <td>Duree de la session</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="warning-card">
        <div class="warning-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div>
          <h4>Les sorties terminal peuvent contenir des donnees sensibles</h4>
          <p>
            Les sessions terminal peuvent involontairement capturer des informations sensibles
            telles que des cles API, des identifiants ou des donnees personnelles presentes dans
            votre code source. ClaudeNest ne filtre ni ne masque les sorties de session.
            Les operateurs doivent mettre en place des politiques de traitement des donnees
            appropriees et en informer leurs utilisateurs.
          </p>
        </div>
      </div>

      <h3 id="context-data">2.4 Donnees de contexte (RAG)</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Donnee</th>
              <th>Finalite</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>content</code> (fragments texte)</td>
              <td>Contexte de projet partage pour la collaboration multi-agent</td>
              <td>Expiration configurable (par defaut : 30 jours)</td>
            </tr>
            <tr>
              <td><code>embedding</code> (vecteur 384d)</td>
              <td>Recherche par similarite semantique via pgvector (distance cosinus)</td>
              <td>Identique au fragment parent</td>
            </tr>
            <tr>
              <td><code>importance_score</code></td>
              <td>Priorisation de la recuperation de contexte</td>
              <td>Identique au fragment parent</td>
            </tr>
            <tr>
              <td><code>files</code> (references)</td>
              <td>Liaison du contexte aux fichiers sources</td>
              <td>Identique au fragment parent</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Les embeddings sont generes localement via <strong>Ollama</strong> avec le modele
        <code>bge-small-en-v1.5</code>. Aucune donnee n'est envoyee a des services d'IA
        externes pour la generation des embeddings.
      </p>

      <h3 id="usage-and-cost-data">2.5 Donnees d'utilisation et de couts</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Donnee</th>
              <th>Finalite</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>total_tokens</code></td>
              <td>Suivi de la consommation de tokens par session et par projet</td>
              <td>Indefinie (metriques agregees)</td>
            </tr>
            <tr>
              <td><code>total_cost</code></td>
              <td>Estimation des couts et suivi budgetaire</td>
              <td>Indefinie (metriques agregees)</td>
            </tr>
            <tr>
              <td><code>context_tokens</code></td>
              <td>Utilisation de la fenetre de contexte par instance Claude</td>
              <td>Duree du cycle de vie de l'instance</td>
            </tr>
            <tr>
              <td><code>tasks_completed</code></td>
              <td>Metriques de productivite et performance de l'instance</td>
              <td>Duree du cycle de vie de l'instance</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="activity-logs">2.6 Journaux d'activite</h3>
      <p>
        ClaudeNest enregistre un journal d'activite pour chaque projet partage, incluant l'identifiant
        d'instance, le type d'evenement et les details de l'evenement (stockes en JSONB). Ces journaux
        sont utilises pour les pistes d'audit, le debogage et la visibilite de la collaboration.
      </p>
    </section>

    <!-- Section 3: Legal Basis -->
    <section id="legal-basis">
      <h2 id="legal-basis">3. Bases legales du traitement (Article 6 RGPD)</h2>
      <p>
        QR Communication traite les donnees personnelles sur les bases legales suivantes,
        definies a l'article 6(1) du Reglement General sur la Protection des Donnees :
      </p>

      <div class="legal-basis-grid">
        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(b)</span>
            <h4>Necessite contractuelle</h4>
          </div>
          <p>
            Le traitement des donnees de compte, des donnees machine et des donnees de session
            est necessaire a l'execution du contrat entre vous et QR Communication (fourniture
            de la plateforme ClaudeNest).
          </p>
          <ul>
            <li>Creation de compte et authentification</li>
            <li>Enregistrement et gestion des machines</li>
            <li>Creation de sessions et relais terminal</li>
            <li>Coordination multi-agent (taches, verrouillages de fichiers)</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(f)</span>
            <h4>Interet legitime</h4>
          </div>
          <p>
            Le traitement des donnees d'utilisation, des journaux d'activite et des metriques
            de performance est fonde sur notre interet legitime a maintenir et ameliorer la plateforme.
          </p>
          <ul>
            <li>Suivi des tokens et des couts pour la transparence</li>
            <li>Journaux d'activite a des fins de securite et d'audit</li>
            <li>Surveillance des performances et optimisation</li>
            <li>Prevention de la fraude et detection des abus</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(a)</span>
            <h4>Consentement</h4>
          </div>
          <p>
            Le cas echeant, certaines activites de traitement requierent votre consentement explicite :
          </p>
          <ul>
            <li>Liaison OAuth avec des fournisseurs tiers (Google, GitHub)</li>
            <li>Analytiques et telemetrie d'utilisation optionnelles (si activees)</li>
            <li>Notifications push sur les appareils mobiles</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(c)</span>
            <h4>Obligation legale</h4>
          </div>
          <p>
            Certaines donnees peuvent etre conservees pour se conformer a des obligations legales :
          </p>
          <ul>
            <li>Respect des exigences legales de conservation des donnees</li>
            <li>Reponse aux procedures judiciaires ou aux demandes gouvernementales</li>
            <li>Documents fiscaux et comptables (le cas echeant)</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 4: How We Use Data -->
    <section id="how-we-use">
      <h2 id="how-we-use">4. Finalites du traitement</h2>
      <p>Vos donnees personnelles sont utilisees exclusivement pour les finalites suivantes :</p>

      <div class="use-cases">
        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <div>
            <h4>Authentification et controle d'acces</h4>
            <p>Verification de votre identite, gestion des sessions et application des politiques d'autorisation.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
            </svg>
          </div>
          <div>
            <h4>Gestion des machines distantes</h4>
            <p>Connexion a vos machines enregistrees, gestion des sessions PTY et relais d'entrees/sorties terminal.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <h4>Collaboration multi-agent</h4>
            <p>Coordination des taches, gestion des verrouillages de fichiers et partage de contexte entre instances Claude.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <div>
            <h4>Contexte RAG (Generation Augmentee par la Recuperation)</h4>
            <p>Generation locale d'embeddings et recherche semantique pour fournir un contexte pertinent aux instances Claude.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div>
            <h4>Suivi d'utilisation et des couts</h4>
            <p>Suivi de la consommation de tokens et estimation des couts pour la transparence et la gestion budgetaire.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
          </div>
          <div>
            <h4>Amelioration de la plateforme</h4>
            <p>Analyse de donnees d'utilisation agregees et anonymisees pour ameliorer les fonctionnalites et les performances.</p>
          </div>
        </div>
      </div>

      <p>
        ClaudeNest n'utilise <strong>pas</strong> vos donnees personnelles a des fins publicitaires,
        de profilage, de prise de decision automatisee ou pour toute finalite etrangere aux
        fonctionnalites principales de la plateforme.
      </p>
    </section>

    <!-- Section 5: Data Retention -->
    <section id="data-retention">
      <h2 id="data-retention">5. Durees de conservation</h2>
      <p>
        Nous conservons les donnees personnelles uniquement pendant la duree necessaire aux
        finalites decrites dans la presente politique. Les durees de conservation suivantes
        s'appliquent :
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Categorie de donnees</th>
              <th>Duree de conservation</th>
              <th>Evenement declencheur de suppression</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Donnees de compte</td>
              <td>Jusqu'a suppression du compte</td>
              <td>L'utilisateur demande la suppression ou le compte est resilie</td>
            </tr>
            <tr>
              <td>Donnees machine</td>
              <td>Jusqu'a suppression de la machine</td>
              <td>L'utilisateur supprime la machine de la plateforme</td>
            </tr>
            <tr>
              <td>Donnees de session</td>
              <td>Configurable (par defaut : 90 jours)</td>
              <td>Expiration automatique ou suppression manuelle</td>
            </tr>
            <tr>
              <td>Journaux de session</td>
              <td>Configurable (par defaut : 90 jours)</td>
              <td>Tache de nettoyage automatique</td>
            </tr>
            <tr>
              <td>Fragments de contexte</td>
              <td>Configurable (par defaut : 30 jours)</td>
              <td>Expiration automatique via <code>expires_at</code></td>
            </tr>
            <tr>
              <td>Embeddings (pgvector)</td>
              <td>Identique au fragment parent</td>
              <td>Suppression en cascade avec le fragment de contexte</td>
            </tr>
            <tr>
              <td>Journaux d'activite</td>
              <td>Configurable (par defaut : 180 jours)</td>
              <td>Tache de nettoyage automatique</td>
            </tr>
            <tr>
              <td>Verrouillages de fichiers</td>
              <td>Jusqu'a liberation ou expiration</td>
              <td>Expiration automatique (par defaut : 30 minutes)</td>
            </tr>
            <tr>
              <td>Metriques d'utilisation</td>
              <td>Indefinie (agregees)</td>
              <td>Suppression du compte (donnees specifiques a l'utilisateur)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Les operateurs d'instances peuvent configurer les durees de conservation via le fichier
        de configuration <code>claudenest.php</code> et les commandes de nettoyage planifiees.
      </p>
    </section>

    <!-- Section 6: Data Sharing -->
    <section id="data-sharing">
      <h2 id="data-sharing">6. Partage et sous-traitants</h2>
      <p>
        ClaudeNest est concu avec un accent fort sur la localite des donnees. Par conception,
        la plateforme minimise les transferts de donnees externes.
      </p>

      <h3 id="infrastructure-components">6.1 Composants d'infrastructure</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Ollama (AI Engine)</h4>
          </div>
          <p>
            Embedding generation (<code>bge-small-en-v1.5</code>) and summarization (<code>mistral:7b</code>)
            are performed entirely on-premise via Ollama. <strong>No data is transmitted to
            external AI services.</strong>
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>PostgreSQL + pgvector</h4>
          </div>
          <p>
            All persistent data, including vector embeddings, is stored in your local or
            self-managed PostgreSQL instance. No cloud database services are required.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Redis</h4>
          </div>
          <p>
            Used for caching, session management, queue processing, and WebSocket state.
            All data remains in-memory on your local or self-managed Redis instance.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Laravel Reverb (WebSocket)</h4>
          </div>
          <p>
            Real-time communication is handled by Laravel Reverb, a self-hosted WebSocket
            server. No third-party WebSocket services (e.g., Pusher, Ably) are used.
          </p>
        </div>
      </div>

      <h3 id="optional-external-services">6.2 Services externes optionnels</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">External</span>
            <h4>Google OAuth</h4>
          </div>
          <p>
            If configured, Google OAuth is used for authentication. Google receives the
            standard OAuth flow data (authorization code, redirect URI). Only the user's
            email, name, and avatar URL are retrieved.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">External</span>
            <h4>GitHub OAuth</h4>
          </div>
          <p>
            If configured, GitHub OAuth is used for authentication. GitHub receives the
            standard OAuth flow data. Only the user's email, name, and avatar URL are retrieved.
          </p>
        </div>
      </div>

      <h3 id="no-data-sales">6.3 Aucune vente de donnees</h3>
      <p>
        ClaudeNest ne vend, ne loue, ne cede et n'echange <strong>aucune</strong> donnee personnelle
        a quelque tiers que ce soit, pour quelque finalite que ce soit. Nous ne pratiquons
        pas le courtage de donnees.
      </p>
    </section>

    <!-- Section 7: Your Rights -->
    <section id="your-rights">
      <h2 id="your-rights">7. Vos droits au titre du RGPD</h2>
      <p>
        En vertu du Reglement General sur la Protection des Donnees et de la loi Informatique
        et Libertes, vous disposez des droits suivants concernant vos donnees personnelles.
        Ces droits peuvent etre exerces en contactant le Delegue a la Protection des Donnees (DPO).
      </p>

      <div class="rights-grid">
        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 15</span>
            <h4>Droit d'acces</h4>
          </div>
          <p>
            Vous avez le droit d'obtenir la confirmation que vos donnees personnelles sont traitees,
            et de recevoir une copie de ces donnees dans un format structure et couramment utilise.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Demandez un export de donnees via les
            parametres de votre compte ou contactez le DPO.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 16</span>
            <h4>Droit de rectification</h4>
          </div>
          <p>
            Vous avez le droit de demander la correction de donnees personnelles inexactes et de
            faire completer des donnees incompletes.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Mettez a jour votre profil dans les parametres
            du compte, ou contactez le DPO pour les donnees que vous ne pouvez pas modifier directement.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 17</span>
            <h4>Droit a l'effacement (droit a l'oubli)</h4>
          </div>
          <p>
            Vous avez le droit de demander la suppression de vos donnees personnelles lorsqu'elles
            ne sont plus necessaires aux finalites pour lesquelles elles ont ete collectees, ou
            lorsque vous retirez votre consentement.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Supprimez votre compte via les parametres
            (suppression en cascade de toutes les donnees associees), ou contactez le DPO.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 18</span>
            <h4>Droit a la limitation du traitement</h4>
          </div>
          <p>
            Vous avez le droit de demander la limitation du traitement de vos donnees dans certaines
            circonstances, par exemple lorsque vous contestez l'exactitude des donnees.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Contactez le DPO avec votre demande specifique de limitation.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 20</span>
            <h4>Droit a la portabilite</h4>
          </div>
          <p>
            Vous avez le droit de recevoir vos donnees personnelles dans un format structure,
            couramment utilise et lisible par machine (JSON), et de les transmettre a un autre
            responsable de traitement.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Utilisez la fonctionnalite d'export de donnees
            dans les parametres de votre compte, qui fournit une archive JSON de toutes vos donnees.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 21</span>
            <h4>Droit d'opposition</h4>
          </div>
          <p>
            Vous avez le droit de vous opposer au traitement de vos donnees personnelles fonde
            sur l'interet legitime, y compris le profilage. Vous pouvez egalement vous opposer
            a tout moment au traitement a des fins de prospection commerciale.
          </p>
          <div class="right-how">
            <strong>Comment exercer ce droit :</strong> Contactez le DPO. Le traitement cessera sauf
            si des motifs legitimes imperieux prevalent sur vos interets.
          </div>
        </div>
      </div>

      <div class="info-card info-card--spaced">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>Droit d'introduire une reclamation</h4>
          <p>
            Si vous estimez que vos droits en matiere de protection des donnees ont ete violes,
            vous avez le droit d'introduire une reclamation aupres de l'autorite de controle
            competente. En France, il s'agit de la
            <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>
            (Commission Nationale de l'Informatique et des Libertes), 3 place de Fontenoy,
            TSA 80715, 75334 Paris Cedex 07.
          </p>
        </div>
      </div>

      <p>
        Nous repondrons a toutes les demandes legitimes dans un delai de <strong>30 jours</strong>.
        Dans les cas complexes, ce delai peut etre prolonge de 60 jours supplementaires,
        avec notification prealable.
      </p>
    </section>

    <!-- Section 8: Cookies -->
    <section id="cookies">
      <h2 id="cookies">8. Cookies et traceurs</h2>
      <p>
        ClaudeNest utilise un nombre minimal de cookies et n'emploie aucune technologie de suivi tiers.
        Pour plus de details, consultez notre <router-link to="/docs/cookies">Politique relative aux cookies</router-link>.
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cookie / Stockage</th>
              <th>Type</th>
              <th>Finalite</th>
              <th>Duree</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>XSRF-TOKEN</code></td>
              <td>Strictement necessaire</td>
              <td>Protection CSRF pour les soumissions de formulaires</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>laravel_session</code></td>
              <td>Strictement necessaire</td>
              <td>Identification de session cote serveur</td>
              <td>2 heures</td>
            </tr>
            <tr>
              <td><code>localStorage: auth_token</code></td>
              <td>Strictement necessaire</td>
              <td>Jeton d'authentification API (Sanctum)</td>
              <td>Jusqu'a la deconnexion</td>
            </tr>
            <tr>
              <td><code>localStorage: theme</code></td>
              <td>Fonctionnel</td>
              <td>Preference de theme de l'utilisateur</td>
              <td>Persistant</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        ClaudeNest n'utilise <strong>pas</strong> :
      </p>
      <ul>
        <li>Google Analytics ou tout autre service d'analyse tiers</li>
        <li>De cookies publicitaires ou de pixels de suivi</li>
        <li>De mecanismes de suivi inter-sites</li>
        <li>De techniques d'empreinte digitale de navigateur</li>
      </ul>

      <p>
        Tous les cookies utilises etant strictement necessaires au fonctionnement de la
        plateforme, aucune banniere de consentement aux cookies n'est requise conformement
        au RGPD et aux recommandations de la CNIL.
      </p>
    </section>

    <!-- Section 9: Data Security -->
    <section id="data-security">
      <h2 id="data-security">9. Mesures de securite</h2>
      <p>
        ClaudeNest met en oeuvre des mesures techniques et organisationnelles completes pour proteger
        vos donnees personnelles contre tout acces non autorise, toute alteration, divulgation ou destruction.
      </p>

      <div class="security-measures">
        <div class="measure-category">
          <h4>Securite du transport</h4>
          <ul>
            <li><strong>TLS 1.3</strong> enforced for all HTTP and WebSocket connections in production</li>
            <li><strong>HTTPS-only</strong> configuration recommended for all deployments</li>
            <li><strong>WebSocket encryption</strong> via WSS (WebSocket Secure) protocol</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Securite de l'authentification</h4>
          <ul>
            <li><strong>Bcrypt hashing</strong> for all passwords (never stored in plaintext)</li>
            <li><strong>SHA-256 hashing</strong> for machine tokens and API tokens</li>
            <li><strong>OS Keychain storage</strong> for agent tokens via <code>keytar</code></li>
            <li><strong>Laravel Sanctum</strong> token-based authentication with scoped abilities</li>
            <li><strong>Token expiration</strong> and rotation mechanisms</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Securite applicative</h4>
          <ul>
            <li><strong>CSRF protection</strong> on all web routes</li>
            <li><strong>Rate limiting</strong> on all API endpoints</li>
            <li><strong>Input validation</strong> via Laravel Form Requests</li>
            <li><strong>Parameterized queries</strong> via Eloquent ORM (SQL injection prevention)</li>
            <li><strong>Content Security Policy</strong> headers</li>
            <li><strong>No sensitive data in logs</strong> policy enforced across all components</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Securite de l'infrastructure</h4>
          <ul>
            <li><strong>Self-hosted architecture</strong> keeping data on your own infrastructure</li>
            <li><strong>Database encryption at rest</strong> (recommended for production)</li>
            <li><strong>Redis AUTH</strong> for cache and queue authentication</li>
            <li><strong>Network isolation</strong> recommended for database and cache services</li>
            <li><strong>Regular security updates</strong> via dependency management</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Securite de l'agent</h4>
          <ul>
            <li><strong>Certificate validation</strong> for TLS connections</li>
            <li><strong>No credential exposure</strong> in logs or terminal output</li>
            <li><strong>Structured logging</strong> via Pino with sensitive data filtering</li>
            <li><strong>Heartbeat monitoring</strong> for connection integrity</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 10: International Transfers -->
    <section id="international-transfers">
      <h2 id="international-transfers">10. Transferts internationaux</h2>
      <p>
        L'instance officielle de ClaudeNest exploitee par QR Communication est hebergee en
        France. Dans cette configuration, aucun transfert international de donnees n'a lieu
        dans le cadre du fonctionnement standard.
      </p>
      <p>
        Pour les instances auto-hebergees, si l'instance est hebergee dans une juridiction et
        accessible depuis une autre, les garanties suivantes doivent etre considerees par
        l'operateur :
      </p>
      <ul>
        <li>
          <strong>UE vers UE :</strong> Aucune garantie supplementaire requise au titre du RGPD.
        </li>
        <li>
          <strong>UE vers pays adequats :</strong> Les transferts vers des pays faisant l'objet
          d'une decision d'adequation de la Commission europeenne sont autorises sans garantie
          supplementaire.
        </li>
        <li>
          <strong>UE vers pays tiers :</strong> Des garanties appropriees doivent etre mises en
          place, telles que les Clauses Contractuelles Types (CCT) ou les Regles d'Entreprise
          Contraignantes (BCR).
        </li>
      </ul>
      <p>
        Lorsque les fournisseurs OAuth sont utilises (Google, GitHub), les donnees d'authentification
        peuvent etre traitees aux Etats-Unis. Google et GitHub se sont tous deux engages a respecter
        le cadre de protection des donnees UE-Etats-Unis (EU-U.S. Data Privacy Framework).
      </p>
    </section>

    <!-- Section 11: Children's Privacy -->
    <section id="childrens-privacy">
      <h2 id="childrens-privacy">11. Mineurs</h2>
      <p>
        ClaudeNest est un outil professionnel de developpement logiciel et n'est pas destine
        aux personnes agees de moins de 16 ans (ou de l'age minimum applicable dans votre
        juridiction).
      </p>
      <p>
        Nous ne collectons pas sciemment de donnees personnelles de mineurs. Si vous apprenez
        qu'un mineur a fourni des donnees personnelles a une instance ClaudeNest, veuillez
        contacter le DPO immediatement. Les donnees seront supprimees sans delai.
      </p>
    </section>

    <!-- Section 12: Policy Changes -->
    <section id="policy-changes">
      <h2 id="policy-changes">12. Modifications de la politique</h2>
      <p>
        Nous pouvons mettre a jour la presente Politique de Confidentialite de temps a autre pour
        refleter les changements dans nos pratiques, la technologie, les exigences legales ou d'autres
        facteurs. En cas de modification substantielle :
      </p>
      <ul>
        <li>La date de mise a jour en haut de cette page sera revisee.</li>
        <li>Une notification sera affichee dans le tableau de bord ClaudeNest pendant 30 jours.</li>
        <li>Les utilisateurs inscrits seront notifies par email (si les notifications email sont activees).</li>
        <li>
          Pour les modifications affectant la base legale du traitement ou introduisant de nouvelles
          categories de donnees, nous solliciterons un nouveau consentement lorsque le RGPD l'exige.
        </li>
      </ul>
      <p>
        Nous vous encourageons a consulter regulierement cette Politique de Confidentialite. Votre
        utilisation continue de ClaudeNest apres la publication des modifications constitue
        l'acceptation de la politique mise a jour.
      </p>
    </section>

    <!-- Section 13: Contact DPO -->
    <section id="contact-dpo">
      <h2 id="contact-dpo">13. Contact du Delegue a la Protection des Donnees</h2>
      <p>
        Pour toute question, preoccupation ou demande relative a la presente Politique de
        Confidentialite ou au traitement de vos donnees personnelles, veuillez contacter le
        Delegue a la Protection des Donnees (DPO) :
      </p>

      <div class="contact-card">
        <div class="contact-methods">
          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <div>
              <strong>Email</strong>
              <p><a href="mailto:dpo@claudenest.io">dpo@claudenest.io</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <div>
              <strong>Website</strong>
              <p><a href="https://claudenest.io/privacy" target="_blank" rel="noopener">claudenest.io/privacy</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
            <div>
              <strong>GitHub</strong>
              <p><a href="https://github.com/claudenest/claudenest/issues" target="_blank" rel="noopener">Open an issue</a></p>
            </div>
          </div>
        </div>
      </div>

      <p>
        Nous accuserons reception de votre demande dans un delai de <strong>48 heures</strong>
        et fournirons une reponse motivee dans un delai de <strong>30 jours</strong>,
        conformement a l'article 12(3) du RGPD.
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
// No external dependencies needed for this static legal page
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem;
}

.last-updated {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

/* Table of Contents */
.policy-toc {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  margin-bottom: 3rem;
}

.policy-toc h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.policy-toc ol {
  margin: 0;
  padding-left: 1.25rem;
}

.policy-toc li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.policy-toc a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.policy-toc a:hover {
  color: var(--accent-purple, #a855f7);
}

/* Sections */
section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul, ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

strong {
  color: var(--text-primary);
}

/* Data Tables */
.data-table-wrapper {
  overflow-x: auto;
  margin: 1rem 0 1.5rem;
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--accent-purple, #a855f7);
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

/* Info Card */
.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-indigo, #6366f1) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-indigo, #6366f1) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.info-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: color-mix(in srgb, var(--accent-indigo, #6366f1) 15%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-indigo, #6366f1);
}

.info-icon svg {
  width: 20px;
  height: 20px;
}

.info-card h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.info-card p {
  margin: 0;
  font-size: 0.9rem;
}

.info-card--spaced {
  margin-top: 1.5rem;
}

/* Warning Card */
.warning-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.warning-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
}

.warning-icon svg {
  width: 20px;
  height: 20px;
}

.warning-card h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: #fbbf24;
}

.warning-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Legal Basis Grid */
.legal-basis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.legal-basis-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
}

.basis-header {
  margin-bottom: 0.75rem;
}

.basis-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.legal-basis-card p {
  font-size: 0.9rem;
}

.legal-basis-card ul {
  font-size: 0.9rem;
  margin: 0;
}

/* Use Cases */
.use-cases {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.use-case {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  transition: all 0.2s;
}

.use-case:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border-color: var(--border-color, var(--border));
}

.use-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-purple, #a855f7);
}

.use-icon svg {
  width: 20px;
  height: 20px;
}

.use-case h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.use-case p {
  margin: 0;
  font-size: 0.9rem;
}

/* Third Party Grid */
.third-party-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1rem 0 1.5rem;
}

.third-party-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.25rem;
}

.tp-header {
  margin-bottom: 0.75rem;
}

.tp-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tp-badge.local {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.tp-badge.external {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
}

.third-party-card h4 {
  margin: 0.25rem 0 0;
  font-size: 1rem;
}

.third-party-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Rights Grid */
.rights-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.right-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
}

.right-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.right-article {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 12%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.right-header h4 {
  margin: 0;
}

.right-card p {
  font-size: 0.9rem;
}

.right-how {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  margin-top: 0.75rem;
}

.right-how strong {
  color: var(--text-secondary);
}

/* Security Measures */
.security-measures {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.measure-category {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.25rem;
}

.measure-category h4 {
  color: var(--accent-purple, #a855f7);
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.measure-category ul {
  margin: 0;
  font-size: 0.9rem;
}

.measure-category li {
  margin-bottom: 0.4rem;
}

/* Contact Card */
.contact-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.contact-methods {
  display: grid;
  gap: 1.25rem;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.contact-method svg {
  width: 24px;
  height: 24px;
  color: var(--accent-purple, #a855f7);
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-method strong {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.15rem;
}

.contact-method p {
  margin: 0;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .lead {
    font-size: 1.1rem;
  }

  .legal-basis-grid {
    grid-template-columns: 1fr;
  }

  .third-party-grid {
    grid-template-columns: 1fr;
  }

  .right-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-card,
  .warning-card,
  .use-case {
    flex-direction: column;
  }

  .data-table {
    font-size: 0.8rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.75rem;
  }
}
</style>
