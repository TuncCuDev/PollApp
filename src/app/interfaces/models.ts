export interface Survey {
    id: string;
    title: string;
    category: string;
    description: string;
    end_date: string;
    created_at: string;
}

export interface Question {
    id: string;
    survey_id: string;
    question_number: number;
    question: string;
    description: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    answer_e: string;
    multiple_answers: boolean;
}

export interface Vote {
  id: string;
  survey_id: string;
  question_id: string;
  answer: string;
  created_at: string;
}
