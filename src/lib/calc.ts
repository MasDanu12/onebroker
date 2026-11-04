import type { ArusKas, DataSlice, Pekerjaan, Pengambilan, SlipUpah, StatusKerja, Tagihan } from "@/lib/types"

export type BukuData = DataSlice

export function namaDari<T extends { id: string; nama: string }>(list: T[], id: string) {
  return list.find((x) => x.id === id)?.nama ?? "—"
}

export function sisaPotongan(p: Pengambilan, pekerjaan: Pekerjaan[]) {
  const bagi = pekerjaan.filter((k) => k.pengambilanId === p.id).reduce((a, k) => a + k.qty, 0)
  return p.qty - bagi
}

export function statusKerja(k: Pekerjaan): StatusKerja {
  if (k.qtySelesai + k.qtyRusak < k.qty) return "berjalan"
  if (k.qtySetor < k.qtySelesai) return "menunggu-setor"
  if (k.qtyTertagih < k.qtySetor) return "menunggu-tagih"
  return "beres"
}

export function qtyMasihJahit(k: Pekerjaan) {
  return Math.max(0, k.qty - k.qtySelesai - k.qtyRusak)
}

export function qtyBisaTagih(k: Pekerjaan) {
  return Math.max(0, k.qtySetor - k.qtyTertagih)
}

export function qtyBisaBayar(k: Pekerjaan) {
  return Math.max(0, k.qtySelesai - k.qtyTerbayar)
}

export function nilaiTagihan(t: Tagihan) {
  return t.items.reduce((a, i) => a + i.qty * i.hargaPerPcs, 0)
}

export function nilaiSlip(s: SlipUpah) {
  return s.items.reduce((a, i) => a + i.qty * i.upahPerPcs, 0)
}

export function masukKas(jenis: ArusKas["jenis"]) {
  return jenis === "modal" || jenis === "terima_pabrik" || jenis === "muka_pabrik"
}

export function saldoKas(kas: ArusKas[]) {
  return kas.reduce((a, k) => a + (masukKas(k.jenis) ? k.jumlah : -k.jumlah), 0)
}

export function sisaKasbon(penjahitId: string, kas: ArusKas[], slip: SlipUpah[]) {
  const diberi = kas
    .filter((k) => k.jenis === "kasbon_penjahit" && k.penjahitId === penjahitId)
    .reduce((a, k) => a + k.jumlah, 0)
  const dipotong = slip
    .filter((s) => s.penjahitId === penjahitId)
    .reduce((a, s) => a + s.potongKasbon, 0)
  return diberi - dipotong
}

export function terimaTagihan(tagihanId: string, kas: ArusKas[]) {
  return kas.filter((k) => k.tagihanId === tagihanId).reduce((a, k) => a + k.jumlah, 0)
}

export function saldoPabrik(d: BukuData) {
  return d.pabrik.map((p) => {
    const tagih = d.tagihan.filter((t) => t.pabrikId === p.id).reduce((a, t) => a + nilaiTagihan(t), 0)
    const masuk = d.kas
      .filter((k) => k.pabrikId === p.id && (k.jenis === "terima_pabrik" || k.jenis === "muka_pabrik"))
      .reduce((a, k) => a + k.jumlah, 0)
    return { pabrik: p, tagih, masuk, sisa: tagih - masuk }
  })
}

export function saldoPenjahit(d: BukuData) {
  return d.penjahit.map((p) => {
    const jobs = d.pekerjaan.filter((k) => k.penjahitId === p.id)
    const upahBelum = jobs.reduce((a, k) => a + qtyBisaBayar(k) * k.upahPerPcs, 0)
    const kasbon = sisaKasbon(p.id, d.kas, d.slip)
    const pcsJalan = jobs.reduce((a, k) => a + qtyMasihJahit(k), 0)
    return { penjahit: p, upahBelum, kasbon, pcsJalan, net: Math.max(0, upahBelum - kasbon) }
  })
}

export function untungDisetor(d: BukuData, month?: string) {
  let pendapatan = 0
  let upah = 0
  for (const k of d.pekerjaan) {
    if (k.qtySetor <= 0) continue
    if (month && !k.tanggalSetor.startsWith(month)) continue
    const amb = d.pengambilan.find((p) => p.id === k.pengambilanId)
    pendapatan += k.qtySetor * (amb?.hargaPerPcs ?? 0)
    upah += k.qtySetor * k.upahPerPcs
  }
  return { pendapatan, upah, untung: pendapatan - upah }
}

export function upahMengambang(d: BukuData) {
  return d.pekerjaan.reduce((a, k) => a + Math.max(0, k.qtySelesai - k.qtySetor) * k.upahPerPcs, 0)
}

export function chartModel(d: BukuData, month?: string) {
  return d.model
    .map((m) => {
      let pendapatan = 0
      let upah = 0
      for (const k of d.pekerjaan) {
        const amb = d.pengambilan.find((p) => p.id === k.pengambilanId)
        if (!amb || amb.modelId !== m.id) continue
        if (k.qtySetor > 0 && (!month || k.tanggalSetor.startsWith(month))) {
          pendapatan += k.qtySetor * amb.hargaPerPcs
          upah += k.qtySetor * k.upahPerPcs
        }
      }
      return { nama: m.nama, pendapatan, upah }
    })
    .filter((row) => row.pendapatan > 0 || row.upah > 0)
}
