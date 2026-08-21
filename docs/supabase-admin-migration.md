# Migration Supabase admin — à approuver avant exécution

Le dashboard est déjà connecté en lecture aux tables existantes. Deux fonctions restent simulées parce que le schéma Supabase ne contient pas encore de table d’abonnements ni de journal des actions administrateur. Cette migration est volontairement documentée mais non exécutée.

## Table `subscriptions`

Cette table permettrait de relier un abonnement à un garage, de suivre son plan, son statut, son montant et sa période. Elle ne remplace aucune table existante et ne supprime aucune donnée.

```sql
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  garage_id bigint not null references public.garages(id),
  plan text not null check (plan in ('essentiel', 'pro', 'premium')),
  status text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  amount numeric(12, 2) not null default 0,
  currency text not null default 'XAF',
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_garage_id_idx on public.subscriptions(garage_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
```

Avant exécution, il faut vérifier le type réel de `garages.id`. Si `garages.id` n’est pas un `bigint`, le type de `subscriptions.garage_id` doit être ajusté pour correspondre exactement.

## Table `admin_audit_logs`

Cette table conserverait les actions sensibles réalisées depuis le dashboard. Elle ne stocke pas de clé Supabase ni de secret.

```sql
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id text not null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_logs_resource_idx on public.admin_audit_logs(resource_type, resource_id);
```

## Vérification préalable en lecture seule

À exécuter dans **Supabase → SQL Editor**, et non dans l’outil de base de données interne du dashboard :

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('garages', 'subscriptions', 'admin_audit_logs')
order by table_name, ordinal_position;
```

Pour confirmer le type de la clé primaire du garage avant de créer `subscriptions.garage_id` :

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'garages'
  and column_name = 'id';
```

Cette vérification utilise uniquement `table_schema`, `table_name`, `column_name`, `data_type` et `is_nullable`, colonnes disponibles dans le SQL Editor Supabase. Si `garages.id` n’est pas `bigint`, adapter le type de `subscriptions.garage_id` avant toute exécution.

## Procédure sûre

1. Vérifier les types réels des clés étrangères avec les requêtes ci-dessus en lecture seule.
2. Demander l’approbation explicite avant exécution.
3. Exécuter uniquement les commandes `create table if not exists` et `create index if not exists` validées.
4. Vérifier les tables après migration.
5. Connecter ensuite les mutations tRPC protégées par `adminProcedure`.

Aucune commande de ce document n’a été exécutée automatiquement.
