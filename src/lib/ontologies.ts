// src/lib/ontologies.ts
import { OntologyTree, OntologyNode } from "../../shared/types";
import { OntologyService } from "../services/ontology";

export interface OntologyModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  nodes: { [id: string]: OntologyNode };
  rootIds: string[];
  enabled: boolean;
}

/**
 * Comprehensive built-in ontologies for real-world domains
 * Each module can be individually enabled/disabled
 */
export const builtInOntologies: { [moduleId: string]: OntologyModule } = {
  // TECHNOLOGY & SOFTWARE
  software_development: {
    id: "software_development",
    name: "Software Development",
    description:
      "Programming, development tools, methodologies, and technical concepts",
    icon: "💻",
    category: "Technology",
    enabled: false,
    nodes: {
      programming: {
        id: "programming",
        label: "#Programming",
        children: ["frontend", "backend", "mobile", "devops", "testing"],
      },
      frontend: {
        id: "frontend",
        label: "#Frontend",
        parentId: "programming",
        children: ["react", "vue", "angular", "html", "css", "javascript"],
      },
      backend: {
        id: "backend",
        label: "#Backend",
        parentId: "programming",
        children: ["nodejs", "python", "java", "databases", "apis"],
      },
      mobile: {
        id: "mobile",
        label: "#Mobile",
        parentId: "programming",
        children: ["ios", "android", "react_native", "flutter"],
      },
      devops: {
        id: "devops",
        label: "#DevOps",
        parentId: "programming",
        children: ["docker", "kubernetes", "ci_cd", "aws", "monitoring"],
      },
      testing: {
        id: "testing",
        label: "#Testing",
        parentId: "programming",
        children: ["unit_testing", "integration_testing", "e2e_testing"],
      },
      react: { id: "react", label: "#React", parentId: "frontend" },
      vue: { id: "vue", label: "#Vue", parentId: "frontend" },
      angular: { id: "angular", label: "#Angular", parentId: "frontend" },
      html: { id: "html", label: "#HTML", parentId: "frontend" },
      css: { id: "css", label: "#CSS", parentId: "frontend" },
      javascript: {
        id: "javascript",
        label: "#JavaScript",
        parentId: "frontend",
      },
      nodejs: { id: "nodejs", label: "#NodeJS", parentId: "backend" },
      python: { id: "python", label: "#Python", parentId: "backend" },
      java: { id: "java", label: "#Java", parentId: "backend" },
      databases: { id: "databases", label: "#Databases", parentId: "backend" },
      apis: { id: "apis", label: "#APIs", parentId: "backend" },
      ios: { id: "ios", label: "#iOS", parentId: "mobile" },
      android: { id: "android", label: "#Android", parentId: "mobile" },
      react_native: {
        id: "react_native",
        label: "#ReactNative",
        parentId: "mobile",
      },
      flutter: { id: "flutter", label: "#Flutter", parentId: "mobile" },
      docker: { id: "docker", label: "#Docker", parentId: "devops" },
      kubernetes: {
        id: "kubernetes",
        label: "#Kubernetes",
        parentId: "devops",
      },
      ci_cd: { id: "ci_cd", label: "#CI/CD", parentId: "devops" },
      aws: { id: "aws", label: "#AWS", parentId: "devops" },
      monitoring: {
        id: "monitoring",
        label: "#Monitoring",
        parentId: "devops",
      },
      unit_testing: {
        id: "unit_testing",
        label: "#UnitTesting",
        parentId: "testing",
      },
      integration_testing: {
        id: "integration_testing",
        label: "#IntegrationTesting",
        parentId: "testing",
      },
      e2e_testing: {
        id: "e2e_testing",
        label: "#E2ETesting",
        parentId: "testing",
      },
    },
    rootIds: ["programming"],
  },

  artificial_intelligence: {
    id: "artificial_intelligence",
    name: "Artificial Intelligence",
    description:
      "AI, machine learning, deep learning, and related technologies",
    icon: "🤖",
    category: "Technology",
    enabled: false,
    nodes: {
      ai: {
        id: "ai",
        label: "#AI",
        children: [
          "machine_learning",
          "deep_learning",
          "nlp",
          "computer_vision",
          "robotics",
        ],
      },
      machine_learning: {
        id: "machine_learning",
        label: "#MachineLearning",
        parentId: "ai",
        children: [
          "supervised_learning",
          "unsupervised_learning",
          "reinforcement_learning",
        ],
      },
      deep_learning: {
        id: "deep_learning",
        label: "#DeepLearning",
        parentId: "ai",
        children: ["neural_networks", "cnn", "rnn", "transformers"],
      },
      nlp: {
        id: "nlp",
        label: "#NLP",
        parentId: "ai",
        children: [
          "llm",
          "sentiment_analysis",
          "text_classification",
          "named_entity_recognition",
        ],
      },
      computer_vision: {
        id: "computer_vision",
        label: "#ComputerVision",
        parentId: "ai",
        children: ["image_classification", "object_detection", "segmentation"],
      },
      robotics: {
        id: "robotics",
        label: "#Robotics",
        parentId: "ai",
        children: ["autonomous_vehicles", "drones", "industrial_robots"],
      },
      supervised_learning: {
        id: "supervised_learning",
        label: "#SupervisedLearning",
        parentId: "machine_learning",
      },
      unsupervised_learning: {
        id: "unsupervised_learning",
        label: "#UnsupervisedLearning",
        parentId: "machine_learning",
      },
      reinforcement_learning: {
        id: "reinforcement_learning",
        label: "#ReinforcementLearning",
        parentId: "machine_learning",
      },
      neural_networks: {
        id: "neural_networks",
        label: "#NeuralNetworks",
        parentId: "deep_learning",
      },
      cnn: { id: "cnn", label: "#CNN", parentId: "deep_learning" },
      rnn: { id: "rnn", label: "#RNN", parentId: "deep_learning" },
      transformers: {
        id: "transformers",
        label: "#Transformers",
        parentId: "deep_learning",
      },
      llm: { id: "llm", label: "#LLM", parentId: "nlp" },
      sentiment_analysis: {
        id: "sentiment_analysis",
        label: "#SentimentAnalysis",
        parentId: "nlp",
      },
      text_classification: {
        id: "text_classification",
        label: "#TextClassification",
        parentId: "nlp",
      },
      named_entity_recognition: {
        id: "named_entity_recognition",
        label: "#NER",
        parentId: "nlp",
      },
      image_classification: {
        id: "image_classification",
        label: "#ImageClassification",
        parentId: "computer_vision",
      },
      object_detection: {
        id: "object_detection",
        label: "#ObjectDetection",
        parentId: "computer_vision",
      },
      segmentation: {
        id: "segmentation",
        label: "#Segmentation",
        parentId: "computer_vision",
      },
      autonomous_vehicles: {
        id: "autonomous_vehicles",
        label: "#AutonomousVehicles",
        parentId: "robotics",
      },
      drones: { id: "drones", label: "#Drones", parentId: "robotics" },
      industrial_robots: {
        id: "industrial_robots",
        label: "#IndustrialRobots",
        parentId: "robotics",
      },
    },
    rootIds: ["ai"],
  },

  // BUSINESS & MANAGEMENT
  business_strategy: {
    id: "business_strategy",
    name: "Business Strategy",
    description:
      "Strategic planning, business models, market analysis, and organizational development",
    icon: "📊",
    category: "Business",
    enabled: false,
    nodes: {
      business: {
        id: "business",
        label: "#Business",
        children: ["strategy", "finance", "marketing", "operations", "hr"],
      },
      strategy: {
        id: "strategy",
        label: "#Strategy",
        parentId: "business",
        children: [
          "competitive_analysis",
          "market_research",
          "business_model",
          "swot_analysis",
        ],
      },
      finance: {
        id: "finance",
        label: "#Finance",
        parentId: "business",
        children: ["budgeting", "forecasting", "investment", "accounting"],
      },
      marketing: {
        id: "marketing",
        label: "#Marketing",
        parentId: "business",
        children: [
          "digital_marketing",
          "content_marketing",
          "seo",
          "social_media",
          "branding",
        ],
      },
      operations: {
        id: "operations",
        label: "#Operations",
        parentId: "business",
        children: [
          "supply_chain",
          "quality_management",
          "process_improvement",
          "logistics",
        ],
      },
      hr: {
        id: "hr",
        label: "#HumanResources",
        parentId: "business",
        children: [
          "recruitment",
          "performance_management",
          "training",
          "compensation",
        ],
      },
      competitive_analysis: {
        id: "competitive_analysis",
        label: "#CompetitiveAnalysis",
        parentId: "strategy",
      },
      market_research: {
        id: "market_research",
        label: "#MarketResearch",
        parentId: "strategy",
      },
      business_model: {
        id: "business_model",
        label: "#BusinessModel",
        parentId: "strategy",
      },
      swot_analysis: {
        id: "swot_analysis",
        label: "#SWOTAnalysis",
        parentId: "strategy",
      },
      budgeting: { id: "budgeting", label: "#Budgeting", parentId: "finance" },
      forecasting: {
        id: "forecasting",
        label: "#Forecasting",
        parentId: "finance",
      },
      investment: {
        id: "investment",
        label: "#Investment",
        parentId: "finance",
      },
      accounting: {
        id: "accounting",
        label: "#Accounting",
        parentId: "finance",
      },
      digital_marketing: {
        id: "digital_marketing",
        label: "#DigitalMarketing",
        parentId: "marketing",
      },
      content_marketing: {
        id: "content_marketing",
        label: "#ContentMarketing",
        parentId: "marketing",
      },
      seo: { id: "seo", label: "#SEO", parentId: "marketing" },
      social_media: {
        id: "social_media",
        label: "#SocialMedia",
        parentId: "marketing",
      },
      branding: { id: "branding", label: "#Branding", parentId: "marketing" },
      supply_chain: {
        id: "supply_chain",
        label: "#SupplyChain",
        parentId: "operations",
      },
      quality_management: {
        id: "quality_management",
        label: "#QualityManagement",
        parentId: "operations",
      },
      process_improvement: {
        id: "process_improvement",
        label: "#ProcessImprovement",
        parentId: "operations",
      },
      logistics: {
        id: "logistics",
        label: "#Logistics",
        parentId: "operations",
      },
      recruitment: { id: "recruitment", label: "#Recruitment", parentId: "hr" },
      performance_management: {
        id: "performance_management",
        label: "#PerformanceManagement",
        parentId: "hr",
      },
      training: { id: "training", label: "#Training", parentId: "hr" },
      compensation: {
        id: "compensation",
        label: "#Compensation",
        parentId: "hr",
      },
    },
    rootIds: ["business"],
  },

  project_management: {
    id: "project_management",
    name: "Project Management",
    description:
      "Project planning, execution, methodologies, and team collaboration",
    icon: "📋",
    category: "Business",
    enabled: false,
    nodes: {
      project_management: {
        id: "project_management",
        label: "#ProjectManagement",
        children: ["agile", "waterfall", "scrum", "kanban", "lean"],
      },
      agile: {
        id: "agile",
        label: "#Agile",
        parentId: "project_management",
        children: ["sprint", "backlog", "user_story", "retrospective"],
      },
      waterfall: {
        id: "waterfall",
        label: "#Waterfall",
        parentId: "project_management",
        children: [
          "requirements",
          "design",
          "implementation",
          "testing",
          "deployment",
        ],
      },
      scrum: {
        id: "scrum",
        label: "#Scrum",
        parentId: "project_management",
        children: [
          "scrum_master",
          "product_owner",
          "sprint_planning",
          "daily_standup",
        ],
      },
      kanban: {
        id: "kanban",
        label: "#Kanban",
        parentId: "project_management",
        children: ["kanban_board", "wip_limits", "continuous_flow"],
      },
      lean: {
        id: "lean",
        label: "#Lean",
        parentId: "project_management",
        children: [
          "waste_elimination",
          "value_stream",
          "continuous_improvement",
        ],
      },
      sprint: { id: "sprint", label: "#Sprint", parentId: "agile" },
      backlog: { id: "backlog", label: "#Backlog", parentId: "agile" },
      user_story: { id: "user_story", label: "#UserStory", parentId: "agile" },
      retrospective: {
        id: "retrospective",
        label: "#Retrospective",
        parentId: "agile",
      },
      requirements: {
        id: "requirements",
        label: "#Requirements",
        parentId: "waterfall",
      },
      design: { id: "design", label: "#Design", parentId: "waterfall" },
      implementation: {
        id: "implementation",
        label: "#Implementation",
        parentId: "waterfall",
      },
      testing: { id: "testing", label: "#Testing", parentId: "waterfall" },
      deployment: {
        id: "deployment",
        label: "#Deployment",
        parentId: "waterfall",
      },
      scrum_master: {
        id: "scrum_master",
        label: "#ScrumMaster",
        parentId: "scrum",
      },
      product_owner: {
        id: "product_owner",
        label: "#ProductOwner",
        parentId: "scrum",
      },
      sprint_planning: {
        id: "sprint_planning",
        label: "#SprintPlanning",
        parentId: "scrum",
      },
      daily_standup: {
        id: "daily_standup",
        label: "#DailyStandup",
        parentId: "scrum",
      },
      kanban_board: {
        id: "kanban_board",
        label: "#KanbanBoard",
        parentId: "kanban",
      },
      wip_limits: { id: "wip_limits", label: "#WIPLimits", parentId: "kanban" },
      continuous_flow: {
        id: "continuous_flow",
        label: "#ContinuousFlow",
        parentId: "kanban",
      },
      waste_elimination: {
        id: "waste_elimination",
        label: "#WasteElimination",
        parentId: "lean",
      },
      value_stream: {
        id: "value_stream",
        label: "#ValueStream",
        parentId: "lean",
      },
      continuous_improvement: {
        id: "continuous_improvement",
        label: "#ContinuousImprovement",
        parentId: "lean",
      },
    },
    rootIds: ["project_management"],
  },

  // SCIENCE & RESEARCH
  scientific_research: {
    id: "scientific_research",
    name: "Scientific Research",
    description:
      "Research methods, academic disciplines, and scientific processes",
    icon: "🔬",
    category: "Science",
    enabled: false,
    nodes: {
      science: {
        id: "science",
        label: "#Science",
        children: [
          "research_methods",
          "biology",
          "chemistry",
          "physics",
          "mathematics",
        ],
      },
      research_methods: {
        id: "research_methods",
        label: "#ResearchMethods",
        parentId: "science",
        children: [
          "qualitative",
          "quantitative",
          "experimental",
          "observational",
          "literature_review",
        ],
      },
      biology: {
        id: "biology",
        label: "#Biology",
        parentId: "science",
        children: ["genetics", "ecology", "microbiology", "neuroscience"],
      },
      chemistry: {
        id: "chemistry",
        label: "#Chemistry",
        parentId: "science",
        children: [
          "organic_chemistry",
          "inorganic_chemistry",
          "biochemistry",
          "analytical_chemistry",
        ],
      },
      physics: {
        id: "physics",
        label: "#Physics",
        parentId: "science",
        children: [
          "quantum_physics",
          "thermodynamics",
          "electromagnetism",
          "relativity",
        ],
      },
      mathematics: {
        id: "mathematics",
        label: "#Mathematics",
        parentId: "science",
        children: [
          "statistics",
          "calculus",
          "algebra",
          "geometry",
          "number_theory",
        ],
      },
      qualitative: {
        id: "qualitative",
        label: "#Qualitative",
        parentId: "research_methods",
      },
      quantitative: {
        id: "quantitative",
        label: "#Quantitative",
        parentId: "research_methods",
      },
      experimental: {
        id: "experimental",
        label: "#Experimental",
        parentId: "research_methods",
      },
      observational: {
        id: "observational",
        label: "#Observational",
        parentId: "research_methods",
      },
      literature_review: {
        id: "literature_review",
        label: "#LiteratureReview",
        parentId: "research_methods",
      },
      genetics: { id: "genetics", label: "#Genetics", parentId: "biology" },
      ecology: { id: "ecology", label: "#Ecology", parentId: "biology" },
      microbiology: {
        id: "microbiology",
        label: "#Microbiology",
        parentId: "biology",
      },
      neuroscience: {
        id: "neuroscience",
        label: "#Neuroscience",
        parentId: "biology",
      },
      organic_chemistry: {
        id: "organic_chemistry",
        label: "#OrganicChemistry",
        parentId: "chemistry",
      },
      inorganic_chemistry: {
        id: "inorganic_chemistry",
        label: "#InorganicChemistry",
        parentId: "chemistry",
      },
      biochemistry: {
        id: "biochemistry",
        label: "#Biochemistry",
        parentId: "chemistry",
      },
      analytical_chemistry: {
        id: "analytical_chemistry",
        label: "#AnalyticalChemistry",
        parentId: "chemistry",
      },
      quantum_physics: {
        id: "quantum_physics",
        label: "#QuantumPhysics",
        parentId: "physics",
      },
      thermodynamics: {
        id: "thermodynamics",
        label: "#Thermodynamics",
        parentId: "physics",
      },
      electromagnetism: {
        id: "electromagnetism",
        label: "#Electromagnetism",
        parentId: "physics",
      },
      relativity: {
        id: "relativity",
        label: "#Relativity",
        parentId: "physics",
      },
      statistics: {
        id: "statistics",
        label: "#Statistics",
        parentId: "mathematics",
      },
      calculus: { id: "calculus", label: "#Calculus", parentId: "mathematics" },
      algebra: { id: "algebra", label: "#Algebra", parentId: "mathematics" },
      geometry: { id: "geometry", label: "#Geometry", parentId: "mathematics" },
      number_theory: {
        id: "number_theory",
        label: "#NumberTheory",
        parentId: "mathematics",
      },
    },
    rootIds: ["science"],
  },

  // HEALTH & WELLNESS
  health_wellness: {
    id: "health_wellness",
    name: "Health & Wellness",
    description:
      "Physical health, mental health, fitness, nutrition, and medical topics",
    icon: "🏥",
    category: "Health",
    enabled: false,
    nodes: {
      health: {
        id: "health",
        label: "#Health",
        children: [
          "physical_health",
          "mental_health",
          "nutrition",
          "fitness",
          "medical",
        ],
      },
      physical_health: {
        id: "physical_health",
        label: "#PhysicalHealth",
        parentId: "health",
        children: [
          "preventive_care",
          "chronic_disease",
          "acute_care",
          "rehabilitation",
        ],
      },
      mental_health: {
        id: "mental_health",
        label: "#MentalHealth",
        parentId: "health",
        children: [
          "anxiety",
          "depression",
          "stress_management",
          "therapy",
          "mindfulness",
        ],
      },
      nutrition: {
        id: "nutrition",
        label: "#Nutrition",
        parentId: "health",
        children: [
          "macronutrients",
          "micronutrients",
          "diet_planning",
          "supplements",
        ],
      },
      fitness: {
        id: "fitness",
        label: "#Fitness",
        parentId: "health",
        children: ["cardio", "strength_training", "flexibility", "endurance"],
      },
      medical: {
        id: "medical",
        label: "#Medical",
        parentId: "health",
        children: [
          "diagnosis",
          "treatment",
          "medication",
          "surgery",
          "emergency_care",
        ],
      },
      preventive_care: {
        id: "preventive_care",
        label: "#PreventiveCare",
        parentId: "physical_health",
      },
      chronic_disease: {
        id: "chronic_disease",
        label: "#ChronicDisease",
        parentId: "physical_health",
      },
      acute_care: {
        id: "acute_care",
        label: "#AcuteCare",
        parentId: "physical_health",
      },
      rehabilitation: {
        id: "rehabilitation",
        label: "#Rehabilitation",
        parentId: "physical_health",
      },
      anxiety: { id: "anxiety", label: "#Anxiety", parentId: "mental_health" },
      depression: {
        id: "depression",
        label: "#Depression",
        parentId: "mental_health",
      },
      stress_management: {
        id: "stress_management",
        label: "#StressManagement",
        parentId: "mental_health",
      },
      therapy: { id: "therapy", label: "#Therapy", parentId: "mental_health" },
      mindfulness: {
        id: "mindfulness",
        label: "#Mindfulness",
        parentId: "mental_health",
      },
      macronutrients: {
        id: "macronutrients",
        label: "#Macronutrients",
        parentId: "nutrition",
      },
      micronutrients: {
        id: "micronutrients",
        label: "#Micronutrients",
        parentId: "nutrition",
      },
      diet_planning: {
        id: "diet_planning",
        label: "#DietPlanning",
        parentId: "nutrition",
      },
      supplements: {
        id: "supplements",
        label: "#Supplements",
        parentId: "nutrition",
      },
      cardio: { id: "cardio", label: "#Cardio", parentId: "fitness" },
      strength_training: {
        id: "strength_training",
        label: "#StrengthTraining",
        parentId: "fitness",
      },
      flexibility: {
        id: "flexibility",
        label: "#Flexibility",
        parentId: "fitness",
      },
      endurance: { id: "endurance", label: "#Endurance", parentId: "fitness" },
      diagnosis: { id: "diagnosis", label: "#Diagnosis", parentId: "medical" },
      treatment: { id: "treatment", label: "#Treatment", parentId: "medical" },
      medication: {
        id: "medication",
        label: "#Medication",
        parentId: "medical",
      },
      surgery: { id: "surgery", label: "#Surgery", parentId: "medical" },
      emergency_care: {
        id: "emergency_care",
        label: "#EmergencyCare",
        parentId: "medical",
      },
    },
    rootIds: ["health"],
  },

  // EDUCATION & LEARNING
  education_learning: {
    id: "education_learning",
    name: "Education & Learning",
    description:
      "Educational theories, teaching methods, learning strategies, and academic subjects",
    icon: "📚",
    category: "Education",
    enabled: false,
    nodes: {
      education: {
        id: "education",
        label: "#Education",
        children: [
          "teaching_methods",
          "learning_theories",
          "curriculum_design",
          "assessment",
          "educational_technology",
        ],
      },
      teaching_methods: {
        id: "teaching_methods",
        label: "#TeachingMethods",
        parentId: "education",
        children: [
          "lecture",
          "discussion",
          "hands_on",
          "project_based",
          "flipped_classroom",
        ],
      },
      learning_theories: {
        id: "learning_theories",
        label: "#LearningTheories",
        parentId: "education",
        children: [
          "behaviorism",
          "constructivism",
          "cognitivism",
          "social_learning",
        ],
      },
      curriculum_design: {
        id: "curriculum_design",
        label: "#CurriculumDesign",
        parentId: "education",
        children: [
          "learning_objectives",
          "scaffolding",
          "differentiation",
          "standards_alignment",
        ],
      },
      assessment: {
        id: "assessment",
        label: "#Assessment",
        parentId: "education",
        children: [
          "formative",
          "summative",
          "authentic",
          "self_assessment",
          "peer_assessment",
        ],
      },
      educational_technology: {
        id: "educational_technology",
        label: "#EdTech",
        parentId: "education",
        children: [
          "lms",
          "online_learning",
          "blended_learning",
          "educational_apps",
        ],
      },
      lecture: {
        id: "lecture",
        label: "#Lecture",
        parentId: "teaching_methods",
      },
      discussion: {
        id: "discussion",
        label: "#Discussion",
        parentId: "teaching_methods",
      },
      hands_on: {
        id: "hands_on",
        label: "#HandsOn",
        parentId: "teaching_methods",
      },
      project_based: {
        id: "project_based",
        label: "#ProjectBased",
        parentId: "teaching_methods",
      },
      flipped_classroom: {
        id: "flipped_classroom",
        label: "#FlippedClassroom",
        parentId: "teaching_methods",
      },
      behaviorism: {
        id: "behaviorism",
        label: "#Behaviorism",
        parentId: "learning_theories",
      },
      constructivism: {
        id: "constructivism",
        label: "#Constructivism",
        parentId: "learning_theories",
      },
      cognitivism: {
        id: "cognitivism",
        label: "#Cognitivism",
        parentId: "learning_theories",
      },
      social_learning: {
        id: "social_learning",
        label: "#SocialLearning",
        parentId: "learning_theories",
      },
      learning_objectives: {
        id: "learning_objectives",
        label: "#LearningObjectives",
        parentId: "curriculum_design",
      },
      scaffolding: {
        id: "scaffolding",
        label: "#Scaffolding",
        parentId: "curriculum_design",
      },
      differentiation: {
        id: "differentiation",
        label: "#Differentiation",
        parentId: "curriculum_design",
      },
      standards_alignment: {
        id: "standards_alignment",
        label: "#StandardsAlignment",
        parentId: "curriculum_design",
      },
      formative: {
        id: "formative",
        label: "#FormativeAssessment",
        parentId: "assessment",
      },
      summative: {
        id: "summative",
        label: "#SummativeAssessment",
        parentId: "assessment",
      },
      authentic: {
        id: "authentic",
        label: "#AuthenticAssessment",
        parentId: "assessment",
      },
      self_assessment: {
        id: "self_assessment",
        label: "#SelfAssessment",
        parentId: "assessment",
      },
      peer_assessment: {
        id: "peer_assessment",
        label: "#PeerAssessment",
        parentId: "assessment",
      },
      lms: { id: "lms", label: "#LMS", parentId: "educational_technology" },
      online_learning: {
        id: "online_learning",
        label: "#OnlineLearning",
        parentId: "educational_technology",
      },
      blended_learning: {
        id: "blended_learning",
        label: "#BlendedLearning",
        parentId: "educational_technology",
      },
      educational_apps: {
        id: "educational_apps",
        label: "#EducationalApps",
        parentId: "educational_technology",
      },
    },
    rootIds: ["education"],
  },

  // PERSONAL DEVELOPMENT
  personal_development: {
    id: "personal_development",
    name: "Personal Development",
    description:
      "Personal growth, habits, goals, productivity, and life skills",
    icon: "🌱",
    category: "Personal",
    enabled: false,
    nodes: {
      personal_development: {
        id: "personal_development",
        label: "#PersonalDevelopment",
        children: [
          "goal_setting",
          "habits",
          "productivity",
          "time_management",
          "self_reflection",
        ],
      },
      goal_setting: {
        id: "goal_setting",
        label: "#GoalSetting",
        parentId: "personal_development",
        children: ["smart_goals", "okrs", "vision_board", "milestone_tracking"],
      },
      habits: {
        id: "habits",
        label: "#Habits",
        parentId: "personal_development",
        children: [
          "habit_formation",
          "habit_stacking",
          "keystone_habits",
          "breaking_bad_habits",
        ],
      },
      productivity: {
        id: "productivity",
        label: "#Productivity",
        parentId: "personal_development",
        children: ["gtd", "pomodoro", "deep_work", "batching", "automation"],
      },
      time_management: {
        id: "time_management",
        label: "#TimeManagement",
        parentId: "personal_development",
        children: [
          "prioritization",
          "scheduling",
          "time_blocking",
          "delegation",
        ],
      },
      self_reflection: {
        id: "self_reflection",
        label: "#SelfReflection",
        parentId: "personal_development",
        children: ["journaling", "meditation", "feedback", "self_awareness"],
      },
      smart_goals: {
        id: "smart_goals",
        label: "#SMARTGoals",
        parentId: "goal_setting",
      },
      okrs: { id: "okrs", label: "#OKRs", parentId: "goal_setting" },
      vision_board: {
        id: "vision_board",
        label: "#VisionBoard",
        parentId: "goal_setting",
      },
      milestone_tracking: {
        id: "milestone_tracking",
        label: "#MilestoneTracking",
        parentId: "goal_setting",
      },
      habit_formation: {
        id: "habit_formation",
        label: "#HabitFormation",
        parentId: "habits",
      },
      habit_stacking: {
        id: "habit_stacking",
        label: "#HabitStacking",
        parentId: "habits",
      },
      keystone_habits: {
        id: "keystone_habits",
        label: "#KeystoneHabits",
        parentId: "habits",
      },
      breaking_bad_habits: {
        id: "breaking_bad_habits",
        label: "#BreakingBadHabits",
        parentId: "habits",
      },
      gtd: { id: "gtd", label: "#GTD", parentId: "productivity" },
      pomodoro: {
        id: "pomodoro",
        label: "#Pomodoro",
        parentId: "productivity",
      },
      deep_work: {
        id: "deep_work",
        label: "#DeepWork",
        parentId: "productivity",
      },
      batching: {
        id: "batching",
        label: "#Batching",
        parentId: "productivity",
      },
      automation: {
        id: "automation",
        label: "#Automation",
        parentId: "productivity",
      },
      prioritization: {
        id: "prioritization",
        label: "#Prioritization",
        parentId: "time_management",
      },
      scheduling: {
        id: "scheduling",
        label: "#Scheduling",
        parentId: "time_management",
      },
      time_blocking: {
        id: "time_blocking",
        label: "#TimeBlocking",
        parentId: "time_management",
      },
      delegation: {
        id: "delegation",
        label: "#Delegation",
        parentId: "time_management",
      },
      journaling: {
        id: "journaling",
        label: "#Journaling",
        parentId: "self_reflection",
      },
      meditation: {
        id: "meditation",
        label: "#Meditation",
        parentId: "self_reflection",
      },
      feedback: {
        id: "feedback",
        label: "#Feedback",
        parentId: "self_reflection",
      },
      self_awareness: {
        id: "self_awareness",
        label: "#SelfAwareness",
        parentId: "self_reflection",
      },
    },
    rootIds: ["personal_development"],
  },

  // CREATIVE ARTS
  creative_arts: {
    id: "creative_arts",
    name: "Creative Arts",
    description: "Visual arts, music, writing, design, and creative processes",
    icon: "🎨",
    category: "Creative",
    enabled: false,
    nodes: {
      creative_arts: {
        id: "creative_arts",
        label: "#CreativeArts",
        children: [
          "visual_arts",
          "music",
          "writing",
          "design",
          "performing_arts",
        ],
      },
      visual_arts: {
        id: "visual_arts",
        label: "#VisualArts",
        parentId: "creative_arts",
        children: [
          "painting",
          "drawing",
          "sculpture",
          "photography",
          "digital_art",
        ],
      },
      music: {
        id: "music",
        label: "#Music",
        parentId: "creative_arts",
        children: [
          "composition",
          "performance",
          "music_theory",
          "recording",
          "instruments",
        ],
      },
      writing: {
        id: "writing",
        label: "#Writing",
        parentId: "creative_arts",
        children: [
          "fiction",
          "non_fiction",
          "poetry",
          "screenwriting",
          "copywriting",
        ],
      },
      design: {
        id: "design",
        label: "#Design",
        parentId: "creative_arts",
        children: [
          "graphic_design",
          "ux_design",
          "ui_design",
          "industrial_design",
          "interior_design",
        ],
      },
      performing_arts: {
        id: "performing_arts",
        label: "#PerformingArts",
        parentId: "creative_arts",
        children: ["theater", "dance", "film", "television", "stand_up_comedy"],
      },
      painting: { id: "painting", label: "#Painting", parentId: "visual_arts" },
      drawing: { id: "drawing", label: "#Drawing", parentId: "visual_arts" },
      sculpture: {
        id: "sculpture",
        label: "#Sculpture",
        parentId: "visual_arts",
      },
      photography: {
        id: "photography",
        label: "#Photography",
        parentId: "visual_arts",
      },
      digital_art: {
        id: "digital_art",
        label: "#DigitalArt",
        parentId: "visual_arts",
      },
      composition: {
        id: "composition",
        label: "#Composition",
        parentId: "music",
      },
      performance: {
        id: "performance",
        label: "#Performance",
        parentId: "music",
      },
      music_theory: {
        id: "music_theory",
        label: "#MusicTheory",
        parentId: "music",
      },
      recording: { id: "recording", label: "#Recording", parentId: "music" },
      instruments: {
        id: "instruments",
        label: "#Instruments",
        parentId: "music",
      },
      fiction: { id: "fiction", label: "#Fiction", parentId: "writing" },
      non_fiction: {
        id: "non_fiction",
        label: "#NonFiction",
        parentId: "writing",
      },
      poetry: { id: "poetry", label: "#Poetry", parentId: "writing" },
      screenwriting: {
        id: "screenwriting",
        label: "#Screenwriting",
        parentId: "writing",
      },
      copywriting: {
        id: "copywriting",
        label: "#Copywriting",
        parentId: "writing",
      },
      graphic_design: {
        id: "graphic_design",
        label: "#GraphicDesign",
        parentId: "design",
      },
      ux_design: { id: "ux_design", label: "#UXDesign", parentId: "design" },
      ui_design: { id: "ui_design", label: "#UIDesign", parentId: "design" },
      industrial_design: {
        id: "industrial_design",
        label: "#IndustrialDesign",
        parentId: "design",
      },
      interior_design: {
        id: "interior_design",
        label: "#InteriorDesign",
        parentId: "design",
      },
      theater: {
        id: "theater",
        label: "#Theater",
        parentId: "performing_arts",
      },
      dance: { id: "dance", label: "#Dance", parentId: "performing_arts" },
      film: { id: "film", label: "#Film", parentId: "performing_arts" },
      television: {
        id: "television",
        label: "#Television",
        parentId: "performing_arts",
      },
      stand_up_comedy: {
        id: "stand_up_comedy",
        label: "#StandUpComedy",
        parentId: "performing_arts",
      },
    },
    rootIds: ["creative_arts"],
  },

  // RELATIONSHIPS & SOCIAL
  relationships_social: {
    id: "relationships_social",
    name: "Relationships & Social",
    description:
      "Human relationships, communication, social skills, and interpersonal dynamics",
    icon: "👥",
    category: "Social",
    enabled: false,
    nodes: {
      relationships: {
        id: "relationships",
        label: "#Relationships",
        children: [
          "family",
          "friends",
          "romantic",
          "professional",
          "community",
        ],
      },
      family: {
        id: "family",
        label: "#Family",
        parentId: "relationships",
        children: ["parenting", "marriage", "siblings", "extended_family"],
      },
      friends: {
        id: "friends",
        label: "#Friends",
        parentId: "relationships",
        children: [
          "friendship_building",
          "social_circles",
          "conflict_resolution",
        ],
      },
      romantic: {
        id: "romantic",
        label: "#Romantic",
        parentId: "relationships",
        children: [
          "dating",
          "love_languages",
          "intimacy",
          "relationship_goals",
        ],
      },
      professional: {
        id: "professional",
        label: "#Professional",
        parentId: "relationships",
        children: ["networking", "mentorship", "teamwork", "leadership"],
      },
      community: {
        id: "community",
        label: "#Community",
        parentId: "relationships",
        children: [
          "volunteering",
          "social_groups",
          "civic_engagement",
          "neighbors",
        ],
      },
      parenting: { id: "parenting", label: "#Parenting", parentId: "family" },
      marriage: { id: "marriage", label: "#Marriage", parentId: "family" },
      siblings: { id: "siblings", label: "#Siblings", parentId: "family" },
      extended_family: {
        id: "extended_family",
        label: "#ExtendedFamily",
        parentId: "family",
      },
      friendship_building: {
        id: "friendship_building",
        label: "#FriendshipBuilding",
        parentId: "friends",
      },
      social_circles: {
        id: "social_circles",
        label: "#SocialCircles",
        parentId: "friends",
      },
      conflict_resolution: {
        id: "conflict_resolution",
        label: "#ConflictResolution",
        parentId: "friends",
      },
      dating: { id: "dating", label: "#Dating", parentId: "romantic" },
      love_languages: {
        id: "love_languages",
        label: "#LoveLanguages",
        parentId: "romantic",
      },
      intimacy: { id: "intimacy", label: "#Intimacy", parentId: "romantic" },
      relationship_goals: {
        id: "relationship_goals",
        label: "#RelationshipGoals",
        parentId: "romantic",
      },
      networking: {
        id: "networking",
        label: "#Networking",
        parentId: "professional",
      },
      mentorship: {
        id: "mentorship",
        label: "#Mentorship",
        parentId: "professional",
      },
      teamwork: {
        id: "teamwork",
        label: "#Teamwork",
        parentId: "professional",
      },
      leadership: {
        id: "leadership",
        label: "#Leadership",
        parentId: "professional",
      },
      volunteering: {
        id: "volunteering",
        label: "#Volunteering",
        parentId: "community",
      },
      social_groups: {
        id: "social_groups",
        label: "#SocialGroups",
        parentId: "community",
      },
      civic_engagement: {
        id: "civic_engagement",
        label: "#CivicEngagement",
        parentId: "community",
      },
      neighbors: {
        id: "neighbors",
        label: "#Neighbors",
        parentId: "community",
      },
    },
    rootIds: ["relationships"],
  },
};

/**
 * Utility functions for managing ontology modules
 */
export class OntologyModuleManager {
  /**
   * Get all available ontology modules
   */
  static getAllModules(): OntologyModule[] {
    return Object.values(builtInOntologies);
  }

  /**
   * Get modules by category
   */
  static getModulesByCategory(category: string): OntologyModule[] {
    return Object.values(builtInOntologies).filter(
      (module) => module.category === category,
    );
  }

  /**
   * Get all available categories
   */
  static getCategories(): string[] {
    const categories = new Set(
      Object.values(builtInOntologies).map((module) => module.category),
    );
    return Array.from(categories).sort();
  }

  /**
   * Get enabled modules
   */
  static getEnabledModules(): OntologyModule[] {
    return Object.values(builtInOntologies).filter((module) => module.enabled);
  }

  /**
   * Enable/disable a module
   */
  static toggleModule(moduleId: string, enabled: boolean): boolean {
    if (builtInOntologies[moduleId]) {
      builtInOntologies[moduleId].enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Merge enabled modules into a single ontology tree
   */
  static generateMergedOntology(): OntologyTree {
    const enabledModules = this.getEnabledModules();
    const mergedNodes: { [id: string]: OntologyNode } = {};
    const mergedRootIds: string[] = [];

    // Add nodes from all enabled modules
    enabledModules.forEach((module) => {
      Object.assign(mergedNodes, module.nodes);
      mergedRootIds.push(...module.rootIds);
    });

    return {
      nodes: mergedNodes,
      rootIds: mergedRootIds,
      updatedAt: new Date(),
    };
  }

  /**
   * Create an ontology tree from a specific module
   */
  static getModuleAsOntologyTree(moduleId: string): OntologyTree | null {
    const module = builtInOntologies[moduleId];
    if (!module) return null;

    return {
      nodes: module.nodes,
      rootIds: module.rootIds,
      updatedAt: new Date(),
    };
  }

  /**
   * Get module statistics
   */
  static getModuleStats(
    moduleId: string,
  ): { nodeCount: number; depth: number; categories: number } | null {
    const module = builtInOntologies[moduleId];
    if (!module) return null;

    const nodeCount = Object.keys(module.nodes).length;

    // Calculate maximum depth
    let maxDepth = 0;
    const calculateDepth = (
      nodeId: string,
      currentDepth: number = 0,
    ): number => {
      const node = module.nodes[nodeId];
      if (!node || !node.children || node.children.length === 0) {
        return currentDepth;
      }

      let deepest = currentDepth;
      node.children.forEach((childId) => {
        const childDepth = calculateDepth(childId, currentDepth + 1);
        deepest = Math.max(deepest, childDepth);
      });
      return deepest;
    };

    module.rootIds.forEach((rootId) => {
      maxDepth = Math.max(maxDepth, calculateDepth(rootId));
    });

    const categories = module.rootIds.length;

    return { nodeCount, depth: maxDepth, categories };
  }

  /**
   * Search across all modules
   */
  static searchModules(
    query: string,
  ): { moduleId: string; nodes: OntologyNode[] }[] {
    const results: { moduleId: string; nodes: OntologyNode[] }[] = [];
    const lowercaseQuery = query.toLowerCase();

    Object.entries(builtInOntologies).forEach(([moduleId, module]) => {
      const matchingNodes = Object.values(module.nodes).filter((node) =>
        node.label.toLowerCase().includes(lowercaseQuery),
      );

      if (matchingNodes.length > 0) {
        results.push({ moduleId, nodes: matchingNodes });
      }
    });

    return results;
  }
}
