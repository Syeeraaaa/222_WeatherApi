require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/api/lokasi", async (req, res) => {
    // Mengambil nama kota dari query parameter, default ke "Bandung City" jika kosong
    const kota = req.query.kota || "Bandung City";
    const apiKey = process.env.MAPTILER_API_KEY;
    const baseUrl = process.env.MAPTILER_BASE_URL;

    const url = `${baseUrl}/${encodeURIComponent(kota)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (!data.features || data.features.length === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }

        const feature = data.features[0];
        const lokasi = feature.text || feature.place_name;
        const koordinat = feature.geometry.coordinates; // [longitude, latitude]
        
        // Ekstraksi konteks (negara, provinsi, kecamatan jika ada)
        const context = feature.context || [];
        let negara = "-";
        let provinsi = "-";
        let kecamatan = "-";

        context.forEach(item => {
            if (item.id.startsWith("country")) negara = item.text;
            if (item.id.startsWith("region")) provinsi = item.text;
            if (item.id.startsWith("county") || item.id.startsWith("locality")) kecamatan = item.text;
        });

        res.json({ 
            lokasi: lokasi,
            negara: negara,
            provinsi: provinsi,
            kecamatan: kecamatan,
            longitude: koordinat[0],
            latitude: koordinat[1]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});