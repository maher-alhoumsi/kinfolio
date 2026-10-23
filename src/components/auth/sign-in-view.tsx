'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInView() {
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
          callbackURL: '/',
        },
        {
          onError: (ctx) => {
            toast.error('Unable to sign in', {
              description:
                ctx.error.message ||
                'Please check your email and password and try again.',
            });
          },

          onSuccess: () => {
            router.replace('/');
          },
        },
      );
    } catch {
      toast.error('Unable to sign in', {
        description: 'Something went wrong. Please try again in a moment.',
      });
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up where you left off."
      description="Sign in to see your portfolio and keep your plans moving."
    >
      <Card className="border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="sr-only">
          <CardTitle>Sign in to Kinfolio</CardTitle>
          <CardDescription>Enter your details to continue.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FieldError errors={[form.formState.errors.email]} />
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
                  <FieldError errors={[form.formState.errors.password]} />
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-0 bg-transparent px-0">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
