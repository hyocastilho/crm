
CREATE TYPE public.app_role AS ENUM ('admin','atendente');
CREATE TYPE public.contact_source AS ENUM ('whatsapp','instagram','manual');
CREATE TYPE public.channel AS ENUM ('whatsapp','instagram');
CREATE TYPE public.conv_stage AS ENUM ('novo','em_atendimento','orcamento','pedido','pago','perdido');
CREATE TYPE public.conv_status AS ENUM ('aberta','aguardando','encerrada');
CREATE TYPE public.conv_handler AS ENUM ('bot','humano');
CREATE TYPE public.msg_direction AS ENUM ('in','out');
CREATE TYPE public.msg_author AS ENUM ('customer','bot','human');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'atendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "business visible" ON public.businesses FOR SELECT TO authenticated USING (id = public.current_business_id());

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  instagram_username TEXT,
  source public.contact_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts same business" ON public.contacts FOR ALL TO authenticated
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());
CREATE INDEX contacts_business_idx ON public.contacts(business_id);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel public.channel NOT NULL,
  stage public.conv_stage NOT NULL DEFAULT 'novo',
  status public.conv_status NOT NULL DEFAULT 'aberta',
  handler public.conv_handler NOT NULL DEFAULT 'humano',
  assignee_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations same business" ON public.conversations FOR ALL TO authenticated
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());
CREATE INDEX conversations_business_idx ON public.conversations(business_id);
CREATE INDEX conversations_last_message_idx ON public.conversations(last_message_at DESC);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction public.msg_direction NOT NULL,
  author public.msg_author NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages same business" ON public.messages FOR ALL TO authenticated
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);
CREATE INDEX messages_business_idx ON public.messages(business_id);

CREATE TRIGGER t_businesses_upd BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_contacts_upd BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_conversations_upd BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_messages_upd BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.businesses (id, name) VALUES ('11111111-1111-1111-1111-111111111111','Loja Aurora');

INSERT INTO public.contacts (id, business_id, name, phone, instagram_username, source) VALUES
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Ana Beatriz Souza','+55 92 98111-0101',NULL,'whatsapp'),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Carlos Menezes','+55 92 98111-0202',NULL,'whatsapp'),
 ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Daniela Rocha',NULL,'dani.rocha','instagram'),
 ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Eduardo Lima','+55 92 98111-0404',NULL,'whatsapp'),
 ('22222222-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Fernanda Prado',NULL,'fefe.prado','instagram'),
 ('22222222-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Gustavo Aragão','+55 92 98111-0606','gu.aragao','whatsapp'),
 ('22222222-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Helena Castro',NULL,'helena.castro','instagram'),
 ('22222222-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','Igor Nascimento','+55 92 98111-0808',NULL,'manual');

INSERT INTO public.conversations (id, business_id, contact_id, channel, stage, status, handler, last_message_at) VALUES
 ('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','whatsapp','novo','aberta','humano', now() - interval '10 minutes'),
 ('33333333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','whatsapp','em_atendimento','aberta','humano', now() - interval '40 minutes'),
 ('33333333-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000003','instagram','orcamento','aguardando','humano', now() - interval '2 hours'),
 ('33333333-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000004','whatsapp','pedido','aberta','humano', now() - interval '5 hours'),
 ('33333333-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000005','instagram','pago','encerrada','humano', now() - interval '1 day'),
 ('33333333-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000006','whatsapp','perdido','encerrada','humano', now() - interval '2 days'),
 ('33333333-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000007','instagram','novo','aberta','humano', now() - interval '25 minutes'),
 ('33333333-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000008','whatsapp','em_atendimento','aguardando','humano', now() - interval '3 hours');

INSERT INTO public.messages (business_id, conversation_id, direction, author, body, created_at) VALUES
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001','in','customer','Oi! Vocês têm a bolsa azul em estoque?', now() - interval '12 minutes'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000001','out','human','Oi, Ana! Temos sim, chegou ontem.', now() - interval '10 minutes'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002','in','customer','Bom dia, qual o prazo de entrega para Manaus?', now() - interval '50 minutes'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000002','out','human','Bom dia! De 2 a 3 dias úteis.', now() - interval '40 minutes'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000003','in','customer','Consegue me mandar o orçamento de 3 peças?', now() - interval '3 hours'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000003','out','human','Claro, envio ainda hoje o valor fechado.', now() - interval '2 hours'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000004','in','customer','Fechado, pode separar o pedido.', now() - interval '5 hours'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000005','out','human','Pagamento confirmado, obrigado!', now() - interval '1 day'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000006','in','customer','Por enquanto vou deixar para depois.', now() - interval '2 days'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000007','in','customer','Vi o post do vestido, ainda tem P?', now() - interval '25 minutes'),
 ('11111111-1111-1111-1111-111111111111','33333333-0000-0000-0000-000000000008','in','customer','Consigo trocar a cor do pedido?', now() - interval '3 hours');
