import React from 'react';
import { Upload, X, Calendar, DollarSign, Percent, Image, AlertCircle, MapPin, Clock, Tag, RefreshCw } from 'lucide-react';
import useDealForm from '../hooks/useDealForm';

const DealForm = ({ onSubmit, initialData = null, onCancel, isLoading = false }) => {
  const {
    formData,
    setFormData,
    images,
    setImages,
    businesses,
    categories,
    errors,
    setErrors,
    isSubmitting,
    loadingData,
    fileInputRef,
    handlePriceChange,
    handleImageUpload,
    removeImage,
    reloadData,
    handleSubmit,
  } = useDealForm(initialData);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
        </h2>
        <div className="flex items-center space-x-2">
          {initialData && (
            <span className={`px-2 py-1 rounded text-xs ${formData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {formData.is_active ? 'Active' : 'Inactive'}
            </span>
          )}
          <button
            onClick={reloadData}
            disabled={loadingData.businesses || loadingData.categories}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData.businesses || loadingData.categories ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations générales */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Informations générales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'offre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (errors.title) setErrors({...errors, title: null});
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Pizza Margherita à moitié prix"
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                <p className="text-xs text-gray-500 ml-auto">{formData.title.length}/200</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                  if (errors.description) setErrors({...errors, description: null});
                }}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Décrivez votre offre en détail: conditions, validité, restrictions..."
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                <p className="text-xs text-gray-500 ml-auto">{formData.description.length}/1000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Établissement et Catégorie */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Établissement et Catégorie</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                Établissement *
              </label>
              <select
                value={formData.business}
                onChange={(e) => {
                  setFormData({...formData, business: e.target.value});
                  if (errors.business) setErrors({...errors, business: null});
                }}
                disabled={loadingData.businesses}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.business ? 'border-red-500' : 'border-gray-300'
                } ${loadingData.businesses ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {loadingData.businesses ? 'Chargement...' : 'Sélectionnez un établissement'}
                </option>
                {businesses.map(business => (
                  <option key={business.id} value={business.id}>
                    {business.name} - {business.city || business.address}
                  </option>
                ))}
              </select>
              {errors.business && <p className="text-red-500 text-sm mt-1">{errors.business}</p>}
              {errors.businesses && <p className="text-orange-500 text-sm mt-1">{errors.businesses}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 mr-1" />
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                disabled={loadingData.categories}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loadingData.categories ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {loadingData.categories ? 'Chargement...' : 'Sélectionnez une catégorie'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categories && <p className="text-orange-500 text-sm mt-1">{errors.categories}</p>}
            </div>
          </div>
        </div>

        {/* Prix et Réduction */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Tarification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 mr-1" />
                Prix original (MAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10000"
                value={formData.original_price}
                onChange={(e) => handlePriceChange('original_price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.original_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.original_price && <p className="text-red-500 text-sm mt-1">{errors.original_price}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 mr-1" />
                Prix de l'offre (MAD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deal_price}
                onChange={(e) => handlePriceChange('deal_price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deal_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.deal_price && <p className="text-red-500 text-sm mt-1">{errors.deal_price}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 mr-1" />
                Réduction (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.discount_percentage}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-400 text-sm">Auto</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Calculé automatiquement</p>
            </div>
          </div>

          {formData.original_price && formData.deal_price && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Économie:</strong> {(parseFloat(formData.original_price) - parseFloat(formData.deal_price)).toFixed(2)} MAD 
                ({formData.discount_percentage}% de réduction)
              </p>
            </div>
          )}
        </div>

        {/* Dates et Limites */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Période de validité et limites</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                Date et heure de début *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => {
                  setFormData({...formData, start_date: e.target.value});
                  if (errors.start_date || errors.dates) {
                    setErrors({...errors, start_date: null, dates: null});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_date || errors.dates ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                Date et heure de fin *
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => {
                  setFormData({...formData, end_date: e.target.value});
                  if (errors.end_date || errors.dates) {
                    setErrors({...errors, end_date: null, dates: null});
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_date || errors.dates ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
            </div>
          </div>

          {errors.dates && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.dates}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum d'utilisations
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.max_uses}
                onChange={(e) => {
                  setFormData({...formData, max_uses: e.target.value});
                  if (errors.max_uses) setErrors({...errors, max_uses: null});
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_uses ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Illimité si vide"
              />
              {errors.max_uses && <p className="text-red-500 text-sm mt-1">{errors.max_uses}</p>}
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour un nombre illimité</p>
            </div>

            {initialData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisations actuelles
                </label>
                <input
                  type="number"
                  value={formData.current_uses}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Nombre d'utilisations déjà effectuées</p>
              </div>
            )}
          </div>
        </div>

        {/* Statut */}
        {initialData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Statut de l'offre</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Offre active (visible par les utilisateurs)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Décochez pour désactiver temporairement l'offre sans la supprimer
            </p>
          </div>
        )}

        {/* Upload d'images */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Images de l'offre</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={images.length >= 5}
              >
                <Upload className="w-4 h-4 mr-2" />
                {images.length >= 5 ? 'Limite atteinte' : 'Ajouter des images'}
              </button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>Glissez-déposez ou cliquez pour ajouter des images</p>
              <p>Formats acceptés: JPG, PNG, WebP • Max 5MB par image • {images.length}/5 images</p>
            </div>
          </div>

          {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}

          {/* Aperçu des images */}
          {images.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Aperçu des images ({images.length}/5):</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={image.preview || image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer cette image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="mt-1">
                      <p className="text-xs text-gray-600 truncate">{image.name}</p>
                      {image.isExisting && (
                        <span className="text-xs text-green-600">Existante</span>
                      )}
                      {index === 0 && (
                        <span className="text-xs text-blue-600">Image principale</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 La première image sera utilisée comme image principale de l'offre
              </p>
            </div>
          )}
        </div>

        {/* Résumé de l'offre */}
        {formData.title && formData.original_price && formData.deal_price && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Résumé de l'offre</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Titre:</strong> {formData.title}</p>
              <p><strong>Prix original:</strong> {formData.original_price} MAD</p>
              <p><strong>Prix de l'offre:</strong> {formData.deal_price} MAD</p>
              <p><strong>Économie:</strong> {(parseFloat(formData.original_price) - parseFloat(formData.deal_price)).toFixed(2)} MAD ({formData.discount_percentage}%)</p>
              {formData.start_date && formData.end_date && (
                <p><strong>Période:</strong> {new Date(formData.start_date).toLocaleString('fr-FR')} - {new Date(formData.end_date).toLocaleString('fr-FR')}</p>
              )}
              {formData.max_uses && (
                <p><strong>Limite:</strong> {formData.max_uses} utilisations maximum</p>
              )}
              {businesses.find(b => b.id == formData.business) && (
                <p><strong>Établissement:</strong> {businesses.find(b => b.id == formData.business)?.name}</p>
              )}
              {categories.find(c => c.id == formData.category) && (
                <p><strong>Catégorie:</strong> {categories.find(c => c.id == formData.category)?.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          
          <div className="flex space-x-3">
            {initialData && (
              <button
                type="button"
                onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                className={`px-4 py-2 rounded-md transition-colors ${
                  formData.is_active 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={isSubmitting}
              >
                {formData.is_active ? 'Désactiver' : 'Activer'}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => handleSubmit(onSubmit)}
              disabled={isSubmitting || isLoading || loadingData.businesses || loadingData.categories}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${
                (isSubmitting || isLoading || loadingData.businesses || loadingData.categories) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (loadingData.businesses || loadingData.categories) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Chargement...
                </>
              ) : (
                <>
                  {initialData ? 'Modifier l\'offre' : 'Créer l\'offre'}
                </>
              )}
            </button>
          </div>
        </div>

        {errors.submit && (
          <div className="flex items-center text-red-500 text-sm mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.submit}
          </div>
        )}

        {/* Indicateur de statut de connexion API */}
        {(errors.businesses || errors.categories) && (
          <div className="flex items-center text-orange-500 text-sm mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            <div>
              <p>Problème de connexion à l'API:</p>
              <ul className="list-disc list-inside mt-1">
                {errors.businesses && <li>Établissements: {errors.businesses}</li>}
                {errors.categories && <li>Catégories: {errors.categories}</li>}
              </ul>
              <button
                onClick={reloadData}
                className="mt-2 text-orange-600 hover:text-orange-800 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealForm;
