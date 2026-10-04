// Scripted conversation partners for demoing suggestions without a live
// back-and-forth. Each script is only the other person's lines, written to
// make sense whatever the AAC user replies, and they lean on the sample
// board's vocabulary so suggestions and board taps both have a role.

export interface Scenario {
  id: string;
  title: string;
  partnerLines: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "restaurant",
    title: "Ordering at a restaurant",
    partnerLines: [
      "Hi there! What can I get you to drink?",
      "Sure thing. Are you ready to order some food, or do you need a few minutes?",
      "Great choice. Is there anything else I can get for you?",
      "Here you go. How is everything tasting?",
      "Glad to hear it. Can I get you anything else before I bring the check?",
    ],
  },
  {
    id: "friend",
    title: "Catching up with a friend",
    partnerLines: [
      "Hey! It's so good to see you. How have you been?",
      "What have you been up to lately?",
      "That sounds like a lot. Do you want to get something to eat this weekend?",
      "Where do you want to go?",
      "Perfect, it's a plan. See you then!",
    ],
  },
  {
    id: "doctor",
    title: "Doctor's visit",
    partnerLines: [
      "Hi, come on in. How are you feeling today?",
      "How long have you been feeling that way?",
      "Have you been sleeping okay?",
      "Okay. Is there anything else you need help with today?",
      "Alright, I'll get you some water and be right back.",
    ],
  },
];
