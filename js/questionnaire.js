// Variables pour suivre l'état du questionnaire
let currentStep = "accueil";
let currentService = ''; 
let userResponses = {
  service: '', 
  details: {}, 
  // Les champs de contact seront ajoutés directement à la racine de userResponses
};

// Sélecteurs DOM fréquemment utilisés
const backBtn = document.getElementById('backBtn');
const progressFill = document.getElementById('progressFill');
const step1Label = document.getElementById('step-1-label'); 
const step2Label = document.getElementById('step-2-label'); 
const step3Label = document.getElementById('step-3-label'); 
const questionContainer = document.getElementById('question-container');

// Historique des étapes pour le bouton retour
let stepHistory = [];

// Fonction pour mettre à jour la barre de progression
function updateProgress(value) {
  const progressFillElement = document.getElementById('progressFill') || document.querySelector('.progress-fill-proxatek');
  if (progressFillElement) {
    progressFillElement.style.width = value + '%';
  }
}

// Fonction pour générer le HTML d'une question
function generateQuestionHTML(stepId, stepConfig) {
  let html = '';
  
  if (stepConfig.type === 'text' || stepConfig.type === 'email' || stepConfig.type === 'tel') {
    const placeholderText = stepConfig.placeholder || '';
    // Utilisation de form-input-group au lieu de contact-form pour le questionnaire
    html = `
      <div class="question-section active">
        <div class="question">${stepConfig.question}</div>
        ${stepConfig.subtitle ? `<div class="subtitle">${stepConfig.subtitle}</div>` : '<div class="subtitle"></div>'}
        <div class="form-input-group"> 
          <input type="${stepConfig.type}" id="${stepConfig.responseKey}" class="input-field" placeholder="${placeholderText}">
          <div id="${stepConfig.responseKey}Error" class="error-message" style="display: none;">${stepConfig.errorMessage || ''}</div>
          <button id="${stepConfig.responseKey}Btn" class="input-button" type="button">Suivant</button>
        </div>
      </div>
    `;
  } else {
    let choicesHTML = '';
    if (stepConfig.choices) {
        stepConfig.choices.forEach(choice => {
        let iconHTML = choice.icon ? `<i>${choice.icon}</i>` : '';
        choicesHTML += `<button class="choice" data-value="${choice.value}" type="button">${iconHTML}${choice.label}</button>`;
        });
    }
    
    html = `
      <div class="question-section active">
        <div class="question">${stepConfig.question}</div>
        ${stepConfig.subtitle ? `<div class="subtitle">${stepConfig.subtitle}</div>` : '<div class="subtitle"></div>'}
        <div class="choices">
          ${choicesHTML}
        </div>
      </div>
    `;
  }
  
  return html;
}

// Fonction pour afficher une étape du questionnaire
function showStep(stepId) {
  currentStep = stepId; 
  const stepConfig = questionnaireConfig[stepId];
  
  if (!stepConfig) {
    console.error(`Configuration de l'étape non trouvée pour: ${stepId}`);
    if(questionContainer) questionContainer.innerHTML = `<div class="error-message" style="display:block; text-align:center; padding:20px;">Configuration d'étape manquante. Veuillez contacter le support.</div>`;
    return;
  }
  
  const currentProgress = stepConfig.progress || 0;
  updateProgress(currentProgress);
  
  // Gestion des labels d'étapes
  if (step1Label) step1Label.classList.remove('current');
  if (step2Label) step2Label.classList.remove('current');
  if (step3Label) step3Label.classList.remove('current');

  const SEUIL_FIN_UTILISATEUR = 30;
  const SEUIL_DEBUT_DEVIS = 70;

  if (stepId === 'accueil') {
    if (step1Label) step1Label.classList.add('current'); // Pour la première question après l'accueil
  } else if (stepConfig.nextStep === 'fin' || currentStep.startsWith("contact-")) {
    if (step3Label) step3Label.classList.add('current');
  } else if (currentService && (stepConfig.responseKey || stepConfig.choices)) { 
    if (currentProgress > 0 && currentProgress <= SEUIL_FIN_UTILISATEUR) {
      if (step1Label) step1Label.classList.add('current');
    } else if (currentProgress > SEUIL_FIN_UTILISATEUR && currentProgress < SEUIL_DEBUT_DEVIS) {
      if (step2Label) step2Label.classList.add('current');
    } else { 
      if (step3Label) step3Label.classList.add('current');
    }
  } else { // Fallback si pas dans un service ou contact, se baser sur l'accueil
      if (step1Label) step1Label.classList.add('current');
  }
  
  if(backBtn) backBtn.style.display = stepId === 'accueil' ? 'none' : 'flex';
  
  if(questionContainer) questionContainer.innerHTML = generateQuestionHTML(stepId, stepConfig);
  
  if (stepConfig.type === 'text' || stepConfig.type === 'email' || stepConfig.type === 'tel') {
    setTimeout(() => {
      const inputField = document.getElementById(stepConfig.responseKey);
      if (inputField) {
        let existingResponse = '';
        if (currentStep.startsWith("contact-")) {
            existingResponse = userResponses[stepConfig.responseKey];
        } else if (currentService && userResponses.details[currentService] && userResponses.details[currentService][stepConfig.responseKey]) {
            existingResponse = userResponses.details[currentService][stepConfig.responseKey];
        } else if(userResponses[stepConfig.responseKey]) { 
            existingResponse = userResponses[stepConfig.responseKey];
        }

        if (existingResponse) {
          inputField.value = existingResponse;
        }
        inputField.focus();
      }
    }, 50);
  }
  
  // Gestionnaires d'événements
  if (stepConfig.type === 'text' || stepConfig.type === 'email' || stepConfig.type === 'tel') {
    const proceedButton = document.getElementById(`${stepConfig.responseKey}Btn`);
    const inputElement = document.getElementById(stepConfig.responseKey);

    const validateAndProceed = function() {
      const errorElement = document.getElementById(`${stepConfig.responseKey}Error`);
      let inputValue = inputElement.value.trim();
      let isValid = true;

      const isContactQuestion = currentStep.startsWith("contact-");
      const isRequiredField = isContactQuestion || 
                              (stepConfig.type === 'email') || 
                              (stepConfig.type === 'tel') ||
                              stepConfig.required === true;

      if (isRequiredField && inputValue === '') {
          isValid = false;
      } else if (inputValue !== '') { 
          if (stepConfig.type === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(inputValue)) isValid = false;
          } else if (stepConfig.type === 'tel') {
            const telPattern = /^[+]?[\d\s()-]{8,}$/; 
            if (!telPattern.test(inputValue)) isValid = false;
          }
      }
      
      if (!isValid && isRequiredField) {
        errorElement.textContent = stepConfig.errorMessage || "Ce champ est requis ou le format est incorrect.";
        errorElement.style.display = 'block';
        inputElement.focus();
        return;
      }
      
      if(errorElement) errorElement.style.display = 'none';
      
      if (isContactQuestion) {
        userResponses[stepConfig.responseKey] = inputValue;
      } else if (currentService) { 
        if(!userResponses.details[currentService]) userResponses.details[currentService] = {};
        userResponses.details[currentService][stepConfig.responseKey] = inputValue;
      } else {
          userResponses[stepConfig.responseKey] = inputValue; 
      }
      
      stepHistory.push(currentStep);
      
      if (stepConfig.nextStep === 'fin') {
        handleEndOfQuiz();
      } else {
        showStep(stepConfig.nextStep);
      }
    };
    
    if (proceedButton) proceedButton.addEventListener('click', validateAndProceed);
    if (inputElement) inputElement.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if(proceedButton) proceedButton.click(); 
      }
    });

  } else if (stepConfig.choices) {
    document.querySelectorAll('.choice').forEach(button => {
      button.addEventListener('click', function() {
        const choiceValue = this.getAttribute('data-value');
        
        if (stepId === 'accueil') {
          currentService = choiceValue; // Définit le service principal
          userResponses.service = choiceValue;
          // L'étape utilisateur est active car on a cliqué sur l'accueil pour aller vers un service
          if (step1Label) step1Label.classList.add('current');
          if (step2Label) step2Label.classList.remove('current');
          if (step3Label) step3Label.classList.remove('current');

        } else if (stepConfig.responseKey && currentService) { 
          if (!userResponses.details[currentService]) {
            userResponses.details[currentService] = {};
          }
          userResponses.details[currentService][stepConfig.responseKey] = choiceValue;
        } else if (stepConfig.responseKey) { 
            userResponses[stepConfig.responseKey] = choiceValue;
        }
        
        stepHistory.push(currentStep);
        
        let nextStepValue;
        if (typeof stepConfig.nextStep === 'function') {
          nextStepValue = stepConfig.nextStep(choiceValue);
        } else {
          nextStepValue = stepConfig.nextStep;
        }
        
        showStep(nextStepValue);
      });
    });
  }
}

// Fonction pour gérer la fin du quiz
function handleEndOfQuiz() {
  updateProgress(100);
  if (step1Label) step1Label.classList.remove('current');
  if (step2Label) step2Label.classList.remove('current');
  if (step3Label) step3Label.classList.add('current');
  console.log('Réponses utilisateur finales:', userResponses);
  
  if(backBtn) backBtn.style.display = 'none';
  
  const confirmationHTML = `
    <div class="confirmation-box">
      <div class="confirmation-icon"><i class="fas fa-check-circle"></i></div> 
      <h1>Merci pour votre confiance !</h1>
      <p>Un expert Proxatek vous contactera pour votre projet dans les <span class="highlight">24 heures</span> ouvrées.</p>
      <p>🎁 En attendant, voici votre <span class="highlight">code de réduction de bienvenue de 250 €</span> à mentionner lors de votre échange :</p>
      <div class="code-offre">BIENVENUE250</div>
      
      <p style="margin-top: 2rem;">📱 Souhaitez-vous recevoir ce code par SMS ?</p>
      <form id="smsForm" class="form-input-group"> <!-- Utilisation de form-input-group pour la cohérence -->
        <input type="tel" id="smsPhone" class="input-field" placeholder="Votre numéro de téléphone" value="${userResponses.telephone || ''}">
        <button type="button" id="smsButton" class="input-button">Recevoir le code par SMS</button>
      </form>
    </div>
  `;
  if(questionContainer) questionContainer.innerHTML = confirmationHTML;
  
  setTimeout(() => {
    const smsPhoneField = document.getElementById('smsPhone');
    if (smsPhoneField) smsPhoneField.focus();
  }, 50);
  
  const smsButton = document.getElementById('smsButton');
  const smsPhoneInput = document.getElementById('smsPhone');

  if (smsButton && smsPhoneInput) {
    smsButton.addEventListener('click', function() {
      const phoneNumber = smsPhoneInput.value.trim();
      const telPattern = /^[+]?[\d\s()-]{8,}$/;
      if (phoneNumber && telPattern.test(phoneNumber)) {
        console.log(`Demande d'envoi SMS au ${phoneNumber} avec le code BIENVENUE250`);
        
        this.textContent = 'Envoyé !';
        this.disabled = true;
        smsPhoneInput.disabled = true;
        // Ici, simuler l'envoi ou intégrer une vraie API SMS
        // Exemple: sendSmsApi(phoneNumber, "Votre code Proxatek: BIENVENUE250");
        setTimeout(() => {
          alert('Le code BIENVENUE250 a été (simulé) envoyé au ' + phoneNumber + '. Un conseiller vous contactera bientôt.');
        }, 500);

      } else {
        alert('Veuillez entrer un numéro de téléphone valide.');
        smsPhoneInput.focus();
      }
    });

    smsPhoneInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if(smsButton && !smsButton.disabled) smsButton.click();
        }
    });
  }
}

// Fonction pour revenir à l'étape précédente
function goBack() {
  if (stepHistory.length > 0) {
    const previousStepId = stepHistory.pop();
    
    // Si on revient à l'accueil, réinitialiser currentService et les détails
    if (previousStepId === 'accueil') {
        currentService = ''; 
        userResponses.service = ''; 
        userResponses.details = {}; 
    } else {
        // Tentative de restaurer currentService si on n'est pas à l'accueil
        // Et si on n'est pas dans les questions de contact
        if (!previousStepId.startsWith("contact-") && userResponses.service) {
            currentService = userResponses.service;
        } else if (previousStepId.startsWith("contact-")) {
            // Si on revient d'une question contact à une question de service, currentService devrait déjà être correct
            // Sinon, si on revient d'une question contact à une autre question contact, currentService n'est pas pertinent
        }
    }
    showStep(previousStepId);
  }
}

// Initialiser le questionnaire
document.addEventListener('DOMContentLoaded', function() {
  if (typeof questionnaireConfig !== 'undefined') { 
    showStep('accueil');
  } else {
    console.error("questionnaireConfig n'est pas défini. Vérifiez que config.js est chargé et correct.");
    if(questionContainer) questionContainer.innerHTML = "<p style='color:red;text-align:center;'>Erreur de configuration du questionnaire.</p>";
  }
  if (backBtn) backBtn.addEventListener('click', goBack);
});