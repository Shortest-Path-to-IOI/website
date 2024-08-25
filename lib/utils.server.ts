import {
  Category, PrismaClient, Problem, ResourceItem, SessionId, Topic, User, Comment, Prisma
} from '@prisma/client'
import { cookies } from 'next/headers';

class Cache<
  T extends { id: string },
  InsertArgs,
  UpdateArgs
> {
  private resource: string;
  private cache: Record<string, T>;

  constructor(resource: string) {
    this.cache = {};
    this.resource = resource;
    this.init().then(() => console.log(`Cache for ${resource} initialized`));
  }

  async init() {
    // @ts-ignore
    const data: T[] = await prisma[this.resource].findMany();
    this.cache = Object.fromEntries(data.map(d => [d.id, d]));
  }

  get(id: string): T | undefined {
    return this.cache[id];
  }

  filter(predicate: (d: T) => boolean) {
    return Object.values(this.cache).filter(predicate);
  }

  all<K extends keyof T>(...keys: K[]): Pick<T, K>[] {
    if (keys.length === 0)
      return Object.values(this.cache);
    return Object.values(this.cache).map(d => {
      const obj = keys.reduce((acc, key) => ({ ...acc, [key]: d[key] }), {} as Pick<T, K>);
      return obj;
    });
  }

  async insert(args: InsertArgs){
    // @ts-ignore
    const data: T = await prisma[this.resource].create(args);
    return this.cache[data.id] = data;
  }

  async update(id: string, args: UpdateArgs){
    // @ts-ignore
    const data: T = (await prisma[this.resource].update({ where: { id }, ...args }));
    if (id !== data.id)
      delete this.cache[id];
    return this.cache[data.id] = data;
  }

  upsert(id: string, args: { insert: InsertArgs, update: UpdateArgs }) {
    if (id in this.cache)
      return this.update(id, args.update);
    return this.insert(args.insert);
  }

  async delete(id: string) {
    // @ts-ignore
    await prisma[this.resource].delete({ where: { id } });
    delete this.cache[id];
  }
}

// does not handle user updates
class AuthorCache {
  private cache: Record<string, User[]>;

  constructor() {
    this.cache = {};
    this.init().then(() => console.log("Author cache initialized"));
  }

  async init() {
    const data = await prisma.resourceItem.findMany({
      select: { id: true, authors: true }
    });
    this.cache = Object.fromEntries(data.map(d => [d.id, d.authors]));
  }

  get(id: string): User[] | undefined {
    return this.cache[id];
  }

  async update(id: string, authors: string[]) {
    const toRemove = [];
    for (const author of this.cache[id])
      if (!authors.includes(author.id))
        toRemove.push({ id: author.id });
    const toAdd = [];
    for (const author of authors)
      if (!this.cache[id].find(a => a.id === author))
        toAdd.push({ id: author });
    if (toAdd.length === 0 && toRemove.length === 0) return;
    const data = await prisma.resourceItem.update({
      where: { id },
      data: {
        authors: {
          disconnect: toRemove,
          connect: toAdd
        }
      },
      include: {
        authors: true
      }
    });
    this.cache[id] = data.authors;
  }

  delete(id: string){
    delete this.cache[id];
  }
}

function cacheSingleton(){
  return {
    user: new Cache<User, Prisma.UserCreateArgs, Omit<Prisma.UserUpdateArgs, "where">>("user"),
    sessionId: new Cache<SessionId, Prisma.SessionIdCreateArgs, Omit<Prisma.SessionIdUpdateArgs, "where">>("sessionId"),
    category: new Cache<Category, Prisma.CategoryCreateArgs, Omit<Prisma.CategoryUpdateArgs, "where">>("category"),
    topic: new Cache<Topic, Prisma.TopicCreateArgs, Omit<Prisma.TopicUpdateArgs, "where">>("topic"),
    resourceItem: new Cache<ResourceItem, Prisma.ResourceItemCreateArgs, Omit<Prisma.ResourceItemUpdateArgs, "where">>("resourceItem"),
    problem: new Cache<Problem, Prisma.ProblemCreateArgs, Omit<Prisma.ProblemUpdateArgs, "where">>("problem"),
    comment: new Cache<Comment, Prisma.CommentCreateArgs, Omit<Prisma.CommentUpdateArgs, "where">>("comment"),
    author: new AuthorCache()
  }
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
  cacheGlobal: ReturnType<typeof cacheSingleton>;
} & typeof global;


export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
export const cache = globalThis.cacheGlobal ?? cacheSingleton();
globalThis.prismaGlobal = prisma;
globalThis.cacheGlobal = cache;

let auths: Record<string, User | undefined> = {}
export function findUserBySessionId() {
  const store = cookies();
  let sessionId = store.get("__ssid")?.value;
  if (!sessionId)
    return undefined;
  if (sessionId in auths)
    return auths[sessionId];
  auths[sessionId] = cache.user.get(cache.sessionId.get(sessionId)?.userId || "");
  return auths[sessionId];
}
