import { redirect } from 'next/navigation';
import { obterSessao } from '@/lib/auth';
import { FormularioEndereco } from '@/components/enderecos/FormularioEndereco';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NovoEnderecoPage() {
  const sessao = await obterSessao();

  if (!sessao) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/perfil/enderecos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Adicionar Endereço
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados do novo endereço
            </p>
          </div>
        </div>

        <FormularioEndereco />
      </div>
    </div>
  );
}
