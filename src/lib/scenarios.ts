// Scripted conversation partners for demoing suggestions without a live
// back-and-forth. Each script is only the other person's lines. Rules for
// writing them, so every turn is answerable on the sample board:
// - Ask yes/no questions or offer choices between board words ("eat, or
//   drink?"); avoid open questions about times, places or activities, which
//   the board has no words for.
// - Never assume what the user just said ("Glad to hear it…") – the reply
//   could be anything.

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
      "Sure thing. Are you ready to order some food?",
      "Okay. Is there anything else I can get for you?",
      "Here you go. How is everything tasting?",
      "Would you like any dessert?",
    ],
  },
  {
    id: "friend",
    title: "Catching up with a friend",
    partnerLines: [
      "Hey! It's so good to see you. How have you been?",
      "Do you want to get something to eat while we catch up?",
      "Do you want to eat, or just get something to drink?",
      "Do you like it here?",
      "This was fun. Do you want to do it again next week?",
    ],
  },
  {
    id: "doctor",
    title: "Doctor's visit",
    partnerLines: [
      "Hi, come on in. How are you feeling today?",
      "Have you been feeling this way for more than a week?",
      "Have you been sleeping okay?",
      "Are you eating and drinking okay?",
      "Is there anything else you need help with today?",
      "Alright, I'll get you some water and be right back.",
    ],
  },
];
