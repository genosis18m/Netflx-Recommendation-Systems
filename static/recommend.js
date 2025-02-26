$(function() {
  const API_KEY = 'c9ff7116876f626856ca4a9a1899d193'; // Replace with secured storage
  const MAX_CAST = 10;
  let debounceTimer;

  // Modern event handling
  $('#autoComplete').on('input', function(e) {
    $('.movie-button').prop('disabled', !e.target.value.trim());
  });

  $('.movie-button').on('click', async function(){
    try {
      const title = $('#autoComplete').val().trim();
      if (!title) return;
      
      $('.results').hide();
      $('#loader').fadeIn();
      
      const movieData = await fetchMovieData(title);
      if (!movieData.results.length) showError();
      
      const { id, title: movieTitle } = movieData.results[0];
      const recommendations = await getRecommendations(movieTitle);
      const fullDetails = await processMovieDetails(id, movieTitle, recommendations);
      
      displayResults(fullDetails);
    } catch (error) {
      handleError(error);
    }
  });
});

// Modern async/await implementation
async function fetchMovieData(title) {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`
  );
  return response.json();
}

async function getRecommendations(title) {
  const response = await fetch('/similarity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `name=${encodeURIComponent(title)}`
  });
  return response.text();
}

async function processMovieDetails(movieId, title, recs) {
  const movieDetails = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
  ).then(res => res.json());

  const cast = await fetchCastDetails(movieId);
  const recommendations = await processRecommendations(recs);
  
  return {
    ...movieDetails,
    cast,
    recommendations,
    imdb_id: movieDetails.imdb_id
  };
}

async function fetchCastDetails(movieId) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
  );
  const data = await response.json();
  
  return data.cast.slice(0, MAX_CAST).map(member => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profile: member.profile_path 
      ? `https://image.tmdb.org/t/p/original${member.profile_path}`
      : '/static/no-profile.png'
  }));
}

async function processRecommendations(recs) {
  if (recs.includes('Sorry!')) return [];
  
  return Promise.all(recs.split('---').map(async title => {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`
    );
    const data = await response.json();
    return {
      title,
      poster: data.results[0]?.poster_path 
        ? `https://image.tmdb.org/t/p/original${data.results[0].poster_path}`
        : '/static/no-poster.png'
    };
  }));
}

function displayResults(details) {
  $('#loader').fadeOut(500, () => {
    $('.results').html(`
      <!-- Your template rendering logic here -->
    `).fadeIn();
    
    // Modern smooth scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function handleError(error) {
  console.error('Error:', error);
  $('#loader').fadeOut();
  $('.fail').fadeIn().delay(3000).fadeOut();
}

// Modern event delegation for dynamic elements
$(document).on('click', '.recommend-card', function(e) {
  loadDetails($(this).data('title'));
});
