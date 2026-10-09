/**
 * Script para testar a configuração do Supabase Storage
 * Execute com: node scripts/test-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis do .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();

const BUCKET_NAME = 'SoftShake Images';

async function testStorage() {
  console.log('\n🧪 Testando configuração do Supabase Storage...\n');

  // Verifica variáveis de ambiente
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada');
    return;
  }

  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
    return;
  }

  console.log('✅ Variáveis de ambiente configuradas');
  console.log(`📍 URL: ${url}`);
  console.log(`🔑 Service Key: ${serviceKey.substring(0, 20)}...`);

  // Cria cliente
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n📦 Verificando bucket...');

  try {
    // Lista buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    console.log(`✅ Total de buckets: ${buckets.length}`);
    buckets.forEach(b => console.log(`   - ${b.name} (${b.public ? 'público' : 'privado'})`));

    // Verifica se o bucket específico existe
    const bucket = buckets.find(b => b.name === BUCKET_NAME);

    if (!bucket) {
      console.error(`\n❌ Bucket "${BUCKET_NAME}" não encontrado!`);
      console.log('\n📝 Para criar o bucket:');
      console.log('1. Acesse https://supabase.com/dashboard');
      console.log('2. Vá em Storage');
      console.log('3. Clique em "Create a new bucket"');
      console.log('4. Nome: "SoftShake Images" (com espaço)');
      console.log('5. Deixe DESMARCADO "Public bucket"');
      console.log('6. Clique em "Create bucket"');
      console.log('7. Entre no bucket e crie a pasta "Produtos"');
      return;
    }

    console.log(`\n✅ Bucket "${BUCKET_NAME}" encontrado!`);
    console.log(`   - Tipo: ${bucket.public ? '🌐 Público' : '🔒 Privado'}`);
    console.log(`   - ID: ${bucket.id}`);

    if (bucket.public) {
      console.warn('\n⚠️  ATENÇÃO: O bucket está público!');
      console.warn('   Recomenda-se deixar privado para segurança.');
    }

    // Lista arquivos na pasta Produtos
    console.log('\n📁 Verificando pasta "Produtos"...');

    const { data: files, error: filesError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('Produtos', { limit: 10 });

    if (filesError) {
      if (filesError.message.includes('not found')) {
        console.log('❌ Pasta "Produtos" não encontrada');
        console.log('\n📝 Para criar a pasta:');
        console.log('1. Acesse o bucket no dashboard do Supabase');
        console.log('2. Clique em "Create folder"');
        console.log('3. Nome: "Produtos"');
        console.log('4. Clique em "Create"');
      } else {
        console.error('❌ Erro ao listar arquivos:', filesError.message);
      }
      return;
    }

    console.log(`✅ Pasta "Produtos" encontrada!`);
    console.log(`   - Total de arquivos: ${files.length}`);

    if (files.length > 0) {
      console.log('   - Arquivos:');
      files.slice(0, 5).forEach(f => {
        const size = (f.metadata?.size / 1024).toFixed(2);
        console.log(`     • ${f.name} (${size} KB)`);
      });
      if (files.length > 5) {
        console.log(`     ... e mais ${files.length - 5} arquivos`);
      }
    } else {
      console.log('   - Nenhum arquivo ainda (tudo pronto para uploads!)');
    }

    // Teste de upload (opcional)
    console.log('\n🧪 Testando upload (arquivo de teste)...');

    const testContent = Buffer.from('teste');
    const testPath = `Produtos/test-${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError.message);
      console.log('\n💡 Verifique as permissões do bucket no Supabase');
      return;
    }

    console.log('✅ Upload de teste bem-sucedido!');

    // Remove arquivo de teste
    await supabase.storage.from(BUCKET_NAME).remove([testPath]);
    console.log('✅ Arquivo de teste removido');

    console.log('\n🎉 Tudo configurado corretamente!\n');
    console.log('✨ Você pode começar a usar o sistema de upload de imagens.\n');
    console.log('📝 Para testar:');
    console.log(`   1. Acesse: http://localhost:3001/admin/login`);
    console.log('   2. Faça login como administrador');
    console.log('   3. Vá em "Produtos"');
    console.log('   4. Crie um novo produto e faça upload de uma imagem\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testStorage();
