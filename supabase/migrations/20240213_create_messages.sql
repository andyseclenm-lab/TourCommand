-- Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id), -- Nullable for group chats if needed later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policy: Users can insert their own messages
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Policy: Users can view messages they sent or received
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Add real-time
alter publication supabase_realtime add table messages;
