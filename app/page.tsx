// AI Visual Studio Engine - Prompt bilgisini de gönderiyoruz
  const handleProcessStudio = async () => {
    if (!bundleData) return;
    setProcessingImages(true);

    try {
      const res = await fetch('/api/process-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: bundleData.components, prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setStudioResult(data);
      }
    } catch (err) {
      console.error(err);
    }
    setProcessingImages(false);
  };