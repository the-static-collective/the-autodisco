export interface Album {
  id: number;
  title: string;
  notes: string;
  era?: string;
}

export interface BranchingIdea {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
}

export interface PorchWeather {
  kettleResonance: number;
  quietWonder: number;
  rosemaryActivity: number;
  porchLight: number;
  description: string;
}

export interface SoilAxiom {
  id: string;
  text: string;
}

export interface PorchNode {
  id: string;
  noticing: string;
  timestamp: string;
  ancestor?: string;
  resonatesWith: string[];
  weatherImprint: {
    kettleResonance: number;
    quietWonder: number;
    rosemaryActivity: number;
    porchLight: number;
  };
  questionGrown: string;
  mutation: string;
  stage: 'seed' | 'sprout' | 'rooted' | 'flowering' | 'fruit' | 'compost' | 'soil';
  resonanceWeight: number;
  ledgerEventId?: string;
  parentEventId?: string;
}

export interface Codex {
  system_instructions: string;
  albums: Album[];
  branching_ideas: BranchingIdea[];
  porch_weather?: PorchWeather;
  soil_axioms?: SoilAxiom[];
  porch_nodes?: PorchNode[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Motif {
  id: string;
  name: string;
  code?: string;
  description: string;
  iconName: string;
}
