
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Scale, Ruler, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BMICalculator: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [categoryColor, setCategoryColor] = useState<string>('');
  const { toast } = useToast();

  const calculateBMI = () => {
    if (!weight || !height) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon masukkan berat dan tinggi badan Anda.",
        variant: "destructive",
      });
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100; // Convert cm to m

    if (weightNum <= 0 || heightNum <= 0) {
      toast({
        title: "Data tidak valid",
        description: "Berat dan tinggi badan harus lebih dari 0.",
        variant: "destructive",
      });
      return;
    }

    const bmiValue = weightNum / (heightNum * heightNum);
    setBmi(parseFloat(bmiValue.toFixed(1)));
  };

  useEffect(() => {
    if (bmi !== null) {
      if (bmi < 18.5) {
        setCategory("Berat Badan Kurang");
        setCategoryColor("text-blue-500");
      } else if (bmi >= 18.5 && bmi < 25) {
        setCategory("Berat Badan Normal");
        setCategoryColor("text-green-500");
      } else if (bmi >= 25 && bmi < 30) {
        setCategory("Kelebihan Berat Badan");
        setCategoryColor("text-yellow-500");
      } else {
        setCategory("Obesitas");
        setCategoryColor("text-red-500");
      }
    }
  }, [bmi]);

  const resetCalculator = () => {
    setWeight('');
    setHeight('');
    setBmi(null);
    setCategory('');
  };

  const getBmiAdvice = () => {
    if (!category) return null;

    let advice = '';

    switch (category) {
      case 'Berat Badan Kurang':
        advice = 'Fokus pada makanan lokal padat gizi seperti tempe, tahu, ikan, dan tambahkan santan atau minyak kelapa pada masakan.';
        break;
      case 'Berat Badan Normal':
        advice = 'Pertahankan pola makan seimbang dengan variasi sayuran lokal, protein seperti tempe dan tahu, serta karbohidrat kompleks seperti beras merah.';
        break;
      case 'Kelebihan Berat Badan':
        advice = 'Tingkatkan konsumsi sayuran seperti kangkung, daun singkong, perbanyak protein nabati seperti tempe, dan batasi karbohidrat olahan.';
        break;
      case 'Obesitas':
        advice = 'Prioritaskan sayuran lokal, batasi karbohidrat olahan, ganti dengan ubi jalar atau singkong, dan konsumsi protein tanpa lemak seperti ikan.';
        break;
      default:
        break;
    }

    return (
      <div className="mt-4 text-gray-700 text-sm">
        <p className="font-medium">Rekomendasi pangan lokal:</p>
        <p>{advice}</p>
      </div>
    );
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-center mb-6 text-nutrilokal-blue-dark">
        Kalkulator BMI (Indeks Massa Tubuh)
      </h2>
      
      <Card className="max-w-md mx-auto bg-white shadow-lg hover:shadow-xl transition-all border-gray-200">
        <CardHeader className="bg-gradient-to-r from-nutrilokal-green-light to-nutrilokal-blue-light text-white">
          <CardTitle className="flex items-center justify-center gap-2">
            <Scale className="h-6 w-6" />
            Hitung BMI Anda
          </CardTitle>
          <CardDescription className="text-white text-opacity-90">
            Masukkan berat dan tinggi badan Anda untuk menghitung BMI
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-1">
                <Scale className="h-4 w-4" /> Berat Badan (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="Mis: 65"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="focus:border-nutrilokal-green"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-1">
                <Ruler className="h-4 w-4" /> Tinggi Badan (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="Mis: 165"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="focus:border-nutrilokal-green"
              />
            </div>
          </div>

          {bmi !== null && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-xl font-bold">{bmi}</p>
                <p className={`text-lg font-medium ${categoryColor}`}>{category}</p>
              </div>
              {getBmiAdvice()}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button 
            onClick={calculateBMI}
            className="bg-nutrilokal-green hover:bg-nutrilokal-green-dark"
          >
            Hitung BMI
          </Button>
          <Button 
            variant="outline" 
            onClick={resetCalculator}
          >
            Reset
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6 max-w-md mx-auto text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-1 mb-2">
          <Info className="h-4 w-4 text-nutrilokal-blue" />
          <span className="font-medium">Kategori BMI:</span>
        </div>
        <ul className="space-y-1">
          <li><span className="text-blue-500 font-medium">Kurang</span>: &lt;18.5</li>
          <li><span className="text-green-500 font-medium">Normal</span>: 18.5 - 24.9</li>
          <li><span className="text-yellow-500 font-medium">Kelebihan</span>: 25 - 29.9</li>
          <li><span className="text-red-500 font-medium">Obesitas</span>: ≥30</li>
        </ul>
      </div>
    </section>
  );
};

export default BMICalculator;
