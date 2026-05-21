export const SEED_VERBS = [
  { infinitive: "zijn", past: "was", participle: "geweest", meaning_ru: "быть" },
  { infinitive: "hebben", past: "had", participle: "gehad", meaning_ru: "иметь" },
  { infinitive: "gaan", past: "ging", participle: "gegaan", meaning_ru: "идти" },
  { infinitive: "komen", past: "kwam", participle: "gekomen", meaning_ru: "приходить" },
  { infinitive: "doen", past: "deed", participle: "gedaan", meaning_ru: "делать" },
  { infinitive: "zien", past: "zag", participle: "gezien", meaning_ru: "видеть" },
  { infinitive: "weten", past: "wist", participle: "geweten", meaning_ru: "знать" },
  { infinitive: "krijgen", past: "kreeg", participle: "gekregen", meaning_ru: "получать" },
  { infinitive: "geven", past: "gaf", participle: "gegeven", meaning_ru: "давать" },
  { infinitive: "nemen", past: "nam", participle: "genomen", meaning_ru: "брать" },
  { infinitive: "blijven", past: "bleef", participle: "gebleven", meaning_ru: "оставаться" },
  { infinitive: "lopen", past: "liep", participle: "gelopen", meaning_ru: "идти / бежать" },
  { infinitive: "staan", past: "stond", participle: "gestaan", meaning_ru: "стоять" },
  { infinitive: "zitten", past: "zat", participle: "gezeten", meaning_ru: "сидеть" },
  { infinitive: "liggen", past: "lag", participle: "gelegen", meaning_ru: "лежать" },
  { infinitive: "spreken", past: "sprak", participle: "gesproken", meaning_ru: "говорить" },
  { infinitive: "lezen", past: "las", participle: "gelezen", meaning_ru: "читать" },
  { infinitive: "schrijven", past: "schreef", participle: "geschreven", meaning_ru: "писать" },
  { infinitive: "drinken", past: "dronk", participle: "gedronken", meaning_ru: "пить" },
  { infinitive: "eten", past: "at", participle: "gegeten", meaning_ru: "есть (кушать)" },
  { infinitive: "slapen", past: "sliep", participle: "geslapen", meaning_ru: "спать" },
  { infinitive: "vinden", past: "vond", participle: "gevonden", meaning_ru: "находить" },
  { infinitive: "helpen", past: "hielp", participle: "geholpen", meaning_ru: "помогать" },
  { infinitive: "zwemmen", past: "zwom", participle: "gezwommen", meaning_ru: "плавать" },
  { infinitive: "vliegen", past: "vloog", participle: "gevlogen", meaning_ru: "летать" },
  { infinitive: "winnen", past: "won", participle: "gewonnen", meaning_ru: "выигрывать" },
  { infinitive: "begrijpen", past: "begreep", participle: "begrepen", meaning_ru: "понимать" },
  { infinitive: "rijden", past: "reed", participle: "gereden", meaning_ru: "ехать" },
  { infinitive: "vergeten", past: "vergat", participle: "vergeten", meaning_ru: "забывать" },
  { infinitive: "beginnen", past: "begon", participle: "begonnen", meaning_ru: "начинать" },
];

export const SEED_NOUNS = [
  { word: "huis", article: "het", meaning_ru: "дом" },
  { word: "kind", article: "het", meaning_ru: "ребёнок" },
  { word: "meisje", article: "het", meaning_ru: "девочка" },
  { word: "boek", article: "het", meaning_ru: "книга" },
  { word: "water", article: "het", meaning_ru: "вода" },
  { word: "brood", article: "het", meaning_ru: "хлеб" },
  { word: "bier", article: "het", meaning_ru: "пиво" },
  { word: "eten", article: "het", meaning_ru: "еда" },
  { word: "jaar", article: "het", meaning_ru: "год" },
  { word: "station", article: "het", meaning_ru: "вокзал" },
  { word: "land", article: "het", meaning_ru: "страна" },
  { word: "geld", article: "het", meaning_ru: "деньги" },
  { word: "weer", article: "het", meaning_ru: "погода" },
  { word: "kantoor", article: "het", meaning_ru: "офис" },
  { word: "raam", article: "het", meaning_ru: "окно" },
  { word: "paard", article: "het", meaning_ru: "лошадь" },
  { word: "glas", article: "het", meaning_ru: "стакан" },
  { word: "bed", article: "het", meaning_ru: "кровать" },
  { word: "uur", article: "het", meaning_ru: "час" },
  { word: "feest", article: "het", meaning_ru: "праздник" },
  { word: "man", article: "de", meaning_ru: "мужчина" },
  { word: "vrouw", article: "de", meaning_ru: "женщина" },
  { word: "jongen", article: "de", meaning_ru: "мальчик" },
  { word: "moeder", article: "de", meaning_ru: "мама" },
  { word: "vader", article: "de", meaning_ru: "папа" },
  { word: "familie", article: "de", meaning_ru: "семья" },
  { word: "vriend", article: "de", meaning_ru: "друг" },
  { word: "tijd", article: "de", meaning_ru: "время" },
  { word: "week", article: "de", meaning_ru: "неделя" },
  { word: "dag", article: "de", meaning_ru: "день" },
  { word: "maand", article: "de", meaning_ru: "месяц" },
  { word: "avond", article: "de", meaning_ru: "вечер" },
  { word: "straat", article: "de", meaning_ru: "улица" },
  { word: "auto", article: "de", meaning_ru: "машина" },
  { word: "fiets", article: "de", meaning_ru: "велосипед" },
  { word: "stad", article: "de", meaning_ru: "город" },
  { word: "taal", article: "de", meaning_ru: "язык" },
  { word: "koffie", article: "de", meaning_ru: "кофе" },
  { word: "hond", article: "de", meaning_ru: "собака" },
  { word: "job", article: "de", meaning_ru: "работа" },
];

import { Verb } from "./models/Verb.js";
import { Noun } from "./models/Noun.js";
import { Stats } from "./models/Stats.js";

export async function seedIfNeeded() {
  const now = new Date();
  const verbRows = SEED_VERBS.map((v) => ({ ...v, next_review: now }));
  const nounRows = SEED_NOUNS.map((n) => ({ ...n, next_review: now }));

  const [verbsBefore, nounsBefore] = await Promise.all([Verb.count(), Noun.count()]);

  await Verb.bulkCreate(verbRows, { ignoreDuplicates: true });
  await Noun.bulkCreate(nounRows, { ignoreDuplicates: true });
  await Stats.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });

  const [verbsAfter, nounsAfter] = await Promise.all([Verb.count(), Noun.count()]);
  return {
    verbsAdded: verbsAfter - verbsBefore,
    nounsAdded: nounsAfter - nounsBefore,
    verbsTotal: verbsAfter,
    nounsTotal: nounsAfter,
  };
}
