-- Add DELETE policy for sessions table to allow users to delete their own scan history
CREATE POLICY "Users can delete their own sessions" 
  ON public.sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);