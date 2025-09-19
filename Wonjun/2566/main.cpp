/* ************************************************************************** */
/*                                                                            */
/*                                                      :::    :::    :::     */
/*   Problem Number: 2566                              :+:    :+:      :+:    */
/*                                                    +:+    +:+        +:+   */
/*   By: jack0969 <boj.kr/u/jack0969>                +#+    +#+          +#+  */
/*                                                  +#+      +#+        +#+   */
/*   https://boj.kr/2566                           #+#        #+#      #+#    */
/*   Solved: 2025/09/10 21:27:40 by jack0969      ###          ###   ##.kr    */
/*                                                                            */
/* ************************************************************************** */
#include <iostream>
using namespace std;
int main(){
    int max;
    int x=0,y=0;
    int arr[9][9]={0};
    for(int i=0; i<9; i++){
        for(int j=0; j<9; j++){
            cin >> arr[i][j];
            if(i==0 && j==0){
                max=arr[i][j];
            }
            else if (arr[i][j]>max){
                max=arr[i][j];
                x=i;
                y=j;
            }

            
        }
    }

    cout << max << "\n" << x+1 << " " << y+1;
    return 0;
}