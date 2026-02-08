-- Create municipalities table
CREATE TABLE public.municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT DEFAULT 'Zacatecas',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fields/courts table linked to municipalities
CREATE TABLE public.fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for municipalities
CREATE POLICY "Anyone can view municipalities" ON public.municipalities FOR SELECT USING (true);
CREATE POLICY "Admins can insert municipalities" ON public.municipalities FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update municipalities" ON public.municipalities FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete municipalities" ON public.municipalities FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for fields
CREATE POLICY "Anyone can view fields" ON public.fields FOR SELECT USING (true);
CREATE POLICY "Admins can insert fields" ON public.fields FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update fields" ON public.fields FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete fields" ON public.fields FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Update triggers
CREATE TRIGGER update_municipalities_updated_at BEFORE UPDATE ON public.municipalities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add field_id to matches table (optional reference to field)
ALTER TABLE public.matches ADD COLUMN field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL;