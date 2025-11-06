-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE library_templates 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE 
        id = template_id AND 
        (user_id = increment_template_usage.user_id OR user_id IS NULL);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;