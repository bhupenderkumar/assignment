// src/components/pages/SignUpPage.tsx
import React from 'react';
import SupabaseAuth from '../auth/SupabaseAuth';

const SignUpPage: React.FC = () => {
  return <SupabaseAuth mode="signUp" />;
};

export default SignUpPage;
