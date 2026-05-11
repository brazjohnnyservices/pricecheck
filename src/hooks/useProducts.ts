import { useEffect, useState } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Product } from '@/types/db'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('descricao')
      .then(({ data }) => {
        if (data) setProducts(data)
        setLoading(false)
      })
  }, [])

  return { products, loading }
}
