import { addDays, jakartaToday } from "@/lib/format"
import type { DataSlice } from "@/lib/types"

export function dataKosong(): DataSlice {
  return {
    profil: {
      nama: "Usaha Makloon",
      pemilik: "",
      telepon: "",
      alamat: "",
      hariBayar: 6,
    },
    pabrik: [],
    penjahit: [],
    model: [],
    pengambilan: [],
    pekerjaan: [],
    tagihan: [],
    slip: [],
    kas: [],
    contoh: false,
    seq: { amb: 1, krj: 1, inv: 1, slp: 1, kas: 1 },
  }
}

export function buatContoh(): DataSlice {
  const t = jakartaToday()
  const ambil = addDays(t, -6)
  const bagi = addDays(t, -5)
  const selesai = addDays(t, -2)
  const bayar = addDays(t, -1)

  return {
    profil: {
      nama: "Makloon Hijab Berkah",
      pemilik: "Ibu pemilik",
      telepon: "0812-0000-1111",
      alamat: "Pekalongan",
      hariBayar: 6,
    },
    pabrik: [
      {
        id: "pb-zahra",
        nama: "Zahra Collection",
        telepon: "0812-1000-0001",
        alamat: "Pekalongan",
        catatan: "Bayar biasanya Sabtu",
      },
      {
        id: "pb-melati",
        nama: "Melati Konveksi",
        telepon: "0813-2000-0002",
        alamat: "Bandung",
        catatan: "",
      },
    ],
    penjahit: [
      { id: "pj-siti", nama: "Bu Siti", telepon: "0812-3000-0003", alamat: "", catatan: "" },
      { id: "pj-aminah", nama: "Bu Aminah", telepon: "0812-4000-0004", alamat: "", catatan: "" },
      { id: "pj-rina", nama: "Mbak Rina", telepon: "0812-5000-0005", alamat: "", catatan: "" },
    ],
    model: [
      { id: "md-segi", nama: "Segi empat", hargaPabrik: 5000, upahJahit: 3000 },
      { id: "md-pash", nama: "Pashmina", hargaPabrik: 6000, upahJahit: 3500 },
      { id: "md-bergo", nama: "Bergo", hargaPabrik: 4500, upahJahit: 2500 },
    ],
    pengambilan: [
      {
        id: "amb-1",
        nomor: "AMB-001",
        tanggal: ambil,
        pabrikId: "pb-zahra",
        modelId: "md-segi",
        qty: 100,
        hargaPerPcs: 5000,
        catatan: "Ongkos jahit Rp 5.000, upah penjahit Rp 3.000",
      },
      {
        id: "amb-2",
        nomor: "AMB-002",
        tanggal: addDays(t, -4),
        pabrikId: "pb-melati",
        modelId: "md-pash",
        qty: 80,
        hargaPerPcs: 6000,
        catatan: "",
      },
    ],
    pekerjaan: [
      {
        id: "krj-1",
        nomor: "KRJ-001",
        pengambilanId: "amb-1",
        penjahitId: "pj-siti",
        tanggalBagi: bagi,
        qty: 60,
        upahPerPcs: 3000,
        qtySelesai: 58,
        qtyRusak: 2,
        tanggalSelesai: selesai,
        qtySetor: 58,
        tanggalSetor: selesai,
        qtyTertagih: 58,
        qtyTerbayar: 58,
        catatan: "2 pcs rusak, tidak ditagih dan tidak diupah",
      },
      {
        id: "krj-2",
        nomor: "KRJ-002",
        pengambilanId: "amb-2",
        penjahitId: "pj-rina",
        tanggalBagi: addDays(t, -3),
        qty: 50,
        upahPerPcs: 3500,
        qtySelesai: 0,
        qtyRusak: 0,
        tanggalSelesai: "",
        qtySetor: 0,
        tanggalSetor: "",
        qtyTertagih: 0,
        qtyTerbayar: 0,
        catatan: "",
      },
      {
        id: "krj-3",
        nomor: "KRJ-003",
        pengambilanId: "amb-2",
        penjahitId: "pj-aminah",
        tanggalBagi: addDays(t, -3),
        qty: 30,
        upahPerPcs: 3500,
        qtySelesai: 30,
        qtyRusak: 0,
        tanggalSelesai: bayar,
        qtySetor: 30,
        tanggalSetor: bayar,
        qtyTertagih: 0,
        qtyTerbayar: 0,
        catatan: "Sudah disetor, belum ditagih",
      },
    ],
    tagihan: [
      {
        id: "inv-1",
        nomor: "INV-001",
        tanggal: selesai,
        pabrikId: "pb-zahra",
        items: [{ pekerjaanId: "krj-1", modelNama: "Segi empat", qty: 58, hargaPerPcs: 5000 }],
        catatan: "2 pcs rusak tidak ditagih",
      },
    ],
    slip: [
      {
        id: "slp-1",
        nomor: "SLP-001",
        tanggal: bayar,
        penjahitId: "pj-siti",
        items: [{ pekerjaanId: "krj-1", modelNama: "Segi empat", qty: 58, upahPerPcs: 3000 }],
        potongKasbon: 100000,
        catatan: "Dibayar dari uang pribadi, dipotong kasbon",
      },
    ],
    kas: [
      {
        id: "kas-1",
        nomor: "KAS-001",
        tanggal: bagi,
        jenis: "kasbon_penjahit",
        jumlah: 100000,
        pabrikId: "",
        penjahitId: "pj-siti",
        tagihanId: "",
        slipId: "",
        catatan: "Bu Siti minta uang dulu",
      },
      {
        id: "kas-2",
        nomor: "KAS-002",
        tanggal: bayar,
        jenis: "muka_pabrik",
        jumlah: 200000,
        pabrikId: "pb-zahra",
        penjahitId: "",
        tagihanId: "",
        slipId: "",
        catatan: "Zahra transfer duluan",
      },
      {
        id: "kas-3",
        nomor: "KAS-003",
        tanggal: bayar,
        jenis: "bayar_upah",
        jumlah: 74000,
        pabrikId: "",
        penjahitId: "pj-siti",
        tagihanId: "",
        slipId: "slp-1",
        catatan: "Upah 174.000 dipotong kasbon 100.000",
      },
    ],
    contoh: true,
    seq: { amb: 3, krj: 4, inv: 2, slp: 2, kas: 4 },
  }
}
