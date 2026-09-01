import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Send, BookOpen, Volume2, Languages } from "lucide-react";

export const Route = createFileRoute("/concierge")({
  head: () => ({
    meta: [
      { title: "Sarathi — Hyper-Local AI Travel Guide | Localink" },
      {
        name: "description",
        content:
          "A RAG-powered voice and text concierge trained on Maharashtra's local history, folklore and hidden spots.",
      },
      { property: "og:title", content: "Sarathi — Hyper-Local AI Travel Guide | Localink" },
      {
        property: "og:description",
        content: "Ask in Marathi, Hindi or English — grounded answers with local sources cited.",
      },
    ],
  }),
  component: ConciergePage,
});

type Msg = { role: "user" | "guide"; text: string; sources?: string[] };

const canned: { q: string; a: string; sources: string[] }[] = [
  {
    q: "What's the story behind Shaniwar Wada?",
    a: "Built in 1732 by Bajirao I as the Peshwa seat, it once held a seven-storey mansion — the 1828 fire left only the base and the Delhi Darwaza's elephant-proof spikes. Locals still gather at 6:30 PM for the sound-and-light show; the quieter entrance is the Mastani Darwaza on the north side.",
    sources: ["Pune Gazetteer, 1885", "ASI site record PN-14", "Oral history: Kasba Peth guides"],
  },
  {
    q: "Where do locals eat in Mumbai after midnight?",
    a: "Bhendi Bazaar and Mohammed Ali Road stay awake till 2 AM — baida roti at Suleman's, malpua with rabdi two lanes down. For a calmer option, the Sassoon Dock chai stalls open at 3 AM for fisherfolk and pour the strongest cutting in the city.",
    sources: ["Localink vendor network", "BMC night-market permits 2026"],
  },
  {
    q: "Hidden spot near Ellora?",
    a: "Skip the queue at Cave 16 and start at the Paithani weavers' courtyard in Sambhajinagar — nine months of pit-loom work per saree. Then Ellora's Cave 29 (Dhumar Lena) at 4 PM, when the western light hits the lingam chamber and the tour buses have gone.",
    sources: ["Paithani Weavers' Co-op", "ASI Ellora conservation notes"],
  },
];

function ConciergePage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "guide",
      text: "नमस्कार! I'm Sarathi, your Localink guide. Ask me about any lane, legend or lunch in Maharashtra — I answer from local archives, not the internet's guesswork.",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  function ask(question: string) {
    if (!question.trim()) return;
    const hit =
      canned.find((c) => c.q.toLowerCase() === question.toLowerCase()) ??
      canned.find((c) =>
        c.q
          .toLowerCase()
          .split(" ")
          .some((w) => w.length > 4 && question.toLowerCase().includes(w)),
      );

    setMsgs((m) => [
      ...m,
      { role: "user", text: question },
      hit
        ? { role: "guide", text: hit.a, sources: hit.sources }
        : {
            role: "guide",
            text: "I'm pulling that from the local archive now. In the live build, this question is embedded, matched against Localink's Maharashtra corpus — gazetteers, vendor interviews, temple records — and answered with citations plus a Marathi audio read-out.",
            sources: ["Localink RAG corpus (Maharashtra)"],
          },
    ]);
    setInput("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Sarathi · voice & text, RAG-grounded
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Meet Sarathi, your local guide.</h1>
        <p className="mt-3 text-muted-foreground">
          Trained on Maharashtra gazetteers, temple records and interviews with the people who
          actually run these streets. Marathi, Hindi and English.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="flex flex-col rounded-2xl border border-border bg-card shadow-warm">
          <div className="flex-1 space-y-4 p-6">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p>{m.text}</p>
                {m.sources && (
                  <ul className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px] opacity-80">
                    {m.sources.map((s) => (
                      <li key={s} className="inline-flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {s}
                      </li>
                    ))}
                  </ul>
                )}
                {m.role === "guide" && (
                  <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Volume2 className="h-3 w-3" /> Play in Marathi
                  </button>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-4"
          >
            <button
              type="button"
              onClick={() => setListening((v) => !v)}
              aria-label="Voice input"
              className={`rounded-full p-3 transition-colors ${
                listening ? "bg-sunset text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening… बोला" : "Ask about a fort, a stall, a festival…"}
              className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-full bg-primary p-3 text-primary-foreground"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="space-y-3">
          <p className="text-sm font-semibold">Try asking</p>
          {canned.map((c) => (
            <button
              key={c.q}
              onClick={() => ask(c.q)}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left text-sm shadow-warm transition-transform hover:-translate-y-0.5"
            >
              {c.q}
            </button>
          ))}
          <div className="rounded-2xl border border-border bg-secondary/60 p-4 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Languages className="h-4 w-4" /> मराठी · हिंदी · English
            </p>
            <p className="mt-2">
              Answers are retrieved from a curated Maharashtra corpus, so Sarathi cites where
              each claim came from instead of inventing it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
