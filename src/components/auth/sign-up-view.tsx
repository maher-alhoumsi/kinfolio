'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';

import { Field, FieldLabel } from '@/components/ui/field';
import { AuthShell } from '@/components/auth/auth-shell';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpView() {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignUpValues) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        callbackURL: '/',
      },
      {
        onError: (ctx) => {
          form.setError('root', {
            message:
              ctx.error.message ||
              'An unexpected error occurred during registration.',
          });
        },
        onSuccess: () => {
          router.push('/');
        },
      },
    );
  };

  return (
    <AuthShell
      eyebrow="Start your journey"
      title="Make room for what matters."
      description="Create your Kinfolio account and bring your money into focus."
    >
      <Card className="border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="sr-only">
          <CardTitle>Create your Kinfolio account</CardTitle>
          <CardDescription>Enter your details to get started.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form-level root error rendering */}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            <Controller
              control={form.control}
              name="name"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Full Name</FieldLabel>

                  <Input
                    placeholder="Alex Johnson"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Email Address</FieldLabel>

                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-0 bg-transparent px-0">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
